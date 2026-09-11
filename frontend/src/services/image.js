export async function prepareImage(file) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("invalidImage");
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 50_000_000) {
    bitmap.close();
    throw new Error("invalidImage");
  }
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0,
    edge = 0,
    count = 0;
  const gray = (i) => (data[i] + data[i + 1] + data[i + 2]) / 3;
  for (let i = 0; i < data.length; i += 4) {
    sum += gray(i);
    if (i >= canvas.width * 4) {
      edge += Math.abs(gray(i) - gray(i - canvas.width * 4));
      count++;
    }
  }
  const brightness = sum / (data.length / 4);
  return {
    name: file.name,
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL("image/jpeg", 0.75),
    warning:
      brightness < 35 || brightness > 235
        ? "lighting"
        : edge / Math.max(1, count) < 2
          ? "blur"
          : null,
    analysis: "unavailable",
  };
}
