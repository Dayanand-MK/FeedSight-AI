// Prototype screening thresholds; not calibrated safety limits or an ML classifier.
export const limits = {
  temperature: [-20, 80],
  humidity: [0, 100],
  moisture: [0, 100],
  ph: [0, 14],
  storageAge: [0, 1095],
};
export function sensorAdapter(
  values,
  source = "manual",
  timestamp = new Date().toISOString(),
  allowMissing = false,
) {
  if (!["manual", "virtual", "dataset", "device"].includes(source))
    throw new Error("invalidSource");
  const normalized = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    const value = values[key];
    if (allowMissing && (value === "" || value == null)) {
      normalized[key] = null;
      continue;
    }
    if (
      value === "" ||
      value == null ||
      !Number.isFinite(Number(value)) ||
      Number(value) < min ||
      Number(value) > max
    )
      throw new Error("invalidInput");
    normalized[key] = Number(value);
  }
  return {
    values: normalized,
    source,
    timestamp,
    units: {
      temperature: "°C",
      humidity: "%",
      moisture: "% wet basis",
      ph: "pH",
      storageAge: "days",
    },
  };
}
export function assess(input, { allowMissing = false } = {}) {
  if (
    input.foreignMaterial != null &&
    typeof input.foreignMaterial !== "boolean"
  )
    throw new Error("invalidInput");
  if (
    ((!allowMissing || input.mould != null) &&
      typeof input.mould !== "boolean") ||
    ((!allowMissing || input.smell != null) && typeof input.smell !== "boolean")
  )
    throw new Error("invalidInput");
  if (!["maize_silage", "dry_feed"].includes(input.feedType))
    throw new Error("invalidInput");
  const sensor = sensorAdapter(
    input,
    input.source,
    new Date().toISOString(),
    allowMissing,
  );
  const v = sensor.values;
  const reasons = [];
  const add = (key, points, domain) => reasons.push({ key, points, domain });
  const silage = input.feedType === "maize_silage";
  if (v.moisture > (silage ? 70 : 15)) add("highMoisture", 20, "storage");
  if (v.temperature > 35) add("highTemperature", 20, "freshness");
  if (v.humidity > 80) add("highHumidity", 15, "storage");
  if (silage && v.ph != null && (v.ph > 4.5 || v.ph < 3))
    add("phIssue", 20, "freshness");
  if (input.mould === true) add("mouldReported", 50, "safety");
  if (input.smell === true) add("smellReported", 20, "freshness");
  if (input.foreignMaterial === true) add("foreignReported", 50, "safety");
  const complete =
    ["temperature", "humidity", "moisture", ...(silage ? ["ph"] : [])].every(
      (k) => v[k] != null,
    ) &&
    typeof input.mould === "boolean" &&
    typeof input.smell === "boolean";
  const rawScore = Math.max(
    0,
    100 - reasons.reduce((sum, r) => sum + r.points, 0),
  );
  const score = allowMissing && !complete ? null : rawScore;
  const risk =
    input.mould || input.foreignMaterial || rawScore < 50
      ? "high"
      : reasons.length && (allowMissing || !complete || rawScore < 80)
        ? "moderate"
        : !complete
          ? "unknown"
          : "low";
  const subscore = (domain) =>
    Math.max(
      0,
      100 -
        reasons
          .filter((r) => r.domain === domain)
          .reduce((sum, r) => sum + r.points, 0),
    );
  return {
    version: allowMissing ? "screening-2" : "screening-1",
    complete,
    score,
    risk,
    reasons,
    sensor,
    subscores: {
      storage: subscore("storage"),
      freshness: subscore("freshness"),
      safety: null,
      nutrition: null,
    },
    advisories:
      risk === "high"
        ? ["isolate", "noMix", "confirm", "inspect"]
        : reasons.length
          ? ["inspect", "storageAdvice", "retest"]
          : ["monitor", "notCertificate"],
    visual: input.image ? "unavailable" : "noImage",
    confidence: null,
    nutrition: null,
    nir: "unavailable",
    type: "rule-based-screening",
  };
}
export const presets = {
  low: {
    temperature: 28,
    humidity: 65,
    moisture: 65,
    ph: 4.1,
    storageAge: 15,
    mould: false,
    smell: false,
  },
  moderate: {
    temperature: 28,
    humidity: 65,
    moisture: 76,
    ph: 4.8,
    storageAge: 30,
    mould: false,
    smell: false,
  },
  high: {
    temperature: 40,
    humidity: 90,
    moisture: 80,
    ph: 6.2,
    storageAge: 45,
    mould: true,
    smell: true,
  },
};
export function declining(tests) {
  const sorted = [...tests].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return (
    sorted.length >= 2 &&
    Number.isFinite(sorted.at(-1).result.score) &&
    Number.isFinite(sorted.at(-2).result.score) &&
    sorted.at(-1).result.sensor.source === sorted.at(-2).result.sensor.source &&
    sorted.at(-1).result.score < sorted.at(-2).result.score
  );
}

export function simulationPreset(input, name) {
  const preset = presets[name];
  if (!preset) throw new Error("invalidInput");
  const patch = { ...preset, observationSource: "virtual" };
  if (input.feedType === "dry_feed") {
    patch.moisture = { low: 12, moderate: 18, high: 30 }[name];
    patch.ph = "";
  }
  // Sensor demonstrations must never silently replace a real reported hazard.
  if (
    input.observationSource !== "virtual" &&
    ["mould", "smell", "foreignMaterial"].some(
      (k) => typeof input[k] === "boolean",
    )
  ) {
    for (const key of ["mould", "smell", "foreignMaterial"])
      patch[key] = input[key];
    patch.observationSource = "manual";
  }
  return patch;
}
