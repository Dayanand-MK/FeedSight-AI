export const biomassTargets = [
  "Dry_Green_g",
  "Dry_Dead_g",
  "Dry_Clover_g",
  "GDM_g",
  "Dry_Total_g",
];
let sessionPromise;

// Matches ai.training.biomass.preprocess: explicit pixel-centre sampling.
export function biomassPixels(rgba, width, height) {
  if (width < 2 || height < 1) throw new Error("invalidImage");
  const output = new Float32Array(3 * 224 * 448);
  const mean = [0.485, 0.456, 0.406],
    std = [0.229, 0.224, 0.225];
  const mid = Math.floor(width / 2);
  for (let view = 0; view < 2; view++) {
    const left = view ? mid : 0,
      right = view ? width : mid;
    for (let y = 0; y < 224; y++) {
      const sy = Math.min(height - 1, Math.floor(((y + 0.5) * height) / 224));
      for (let x = 0; x < 224; x++) {
        const sx = Math.min(
          width - 1,
          left + Math.floor(((x + 0.5) * (right - left)) / 224),
        );
        for (let c = 0; c < 3; c++) {
          output[c * 224 * 448 + y * 448 + view * 224 + x] =
            (rgba[(sy * width + sx) * 4 + c] / 255 - mean[c]) / std[c];
        }
      }
    }
  }
  return output;
}

export async function predictBiomass(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "none" });
  try {
    if (bitmap.width * bitmap.height > 50_000_000)
      throw new Error("invalidImage");
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const input = biomassPixels(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
    );
    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;
    if (!sessionPromise) {
      sessionPromise = Promise.all([
        ort.InferenceSession.create(
          `${import.meta.env.BASE_URL}models/biomass/biomass.onnx`,
          { executionProviders: ["wasm"] },
        ),
        fetch(
          `${import.meta.env.BASE_URL}models/biomass/model_metadata.json`,
        ).then((r) => {
          if (!r.ok) throw new Error("Model metadata unavailable");
          return r.json();
        }),
      ]).catch((error) => {
        sessionPromise = null;
        throw error;
      });
    }
    const [session, metadata] = await sessionPromise;
    if (
      metadata.task !== "biomass_regression" ||
      JSON.stringify(metadata.targets) !== JSON.stringify(biomassTargets)
    )
      throw new Error("Incompatible model");
    const results = await session.run({
      image: new ort.Tensor("float32", input, [1, 3, 224, 448]),
    });
    const values = Array.from(results.biomass.data);
    if (values.length !== 5 || values.some((v) => !Number.isFinite(v) || v < 0))
      throw new Error("Invalid model output");
    return {
      task: "biomass_regression",
      status: "experimental",
      unit: "g",
      confidence: null,
      predictions: Object.fromEntries(
        biomassTargets.map((key, i) => [key, values[i]]),
      ),
      model: metadata.architecture,
      scopeConfirmed: true,
    };
  } finally {
    bitmap.close();
  }
}
