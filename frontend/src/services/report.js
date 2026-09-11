import { animalContext, withGoal } from "./goals.js";
import { assess } from "./assessment.js";
import {
  nutritionProfiles,
  nutrientFields,
} from "../config/nutritionProfiles.js";

export function optionalNumber(value, min, max) {
  if (value == null || (typeof value === "string" && value.trim() === ""))
    return null;
  if (
    typeof value === "boolean" ||
    typeof value === "object" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw new Error("invalidInput");
  return Number(value);
}
function nutrition(input, sensor) {
  const profile = nutritionProfiles[input.animalType || "unspecified"];
  if (!profile) throw new Error("invalidInput");
  const reference = input.targets?.enabled
    ? input.targets.reference?.trim()
    : null;
  if (input.targets?.enabled && !reference)
    throw new Error("targetReferenceNeeded");
  const values = {};
  for (const [key, config] of Object.entries(nutrientFields)) {
    const value = optionalNumber(
      input.nutrients?.[key],
      config.min,
      config.max,
    );
    const target =
      input.targets?.enabled && key !== "energy"
        ? optionalNumber(input.targets?.[key], 0, 100)
        : null;
    values[key] = {
      value,
      unit: config.unit,
      source: value == null ? "notAvailable" : "entered",
      target,
      reference,
      status:
        value == null
          ? "notAvailable"
          : target == null
            ? "insufficient"
            : value < target
              ? "belowTarget"
              : "meetsMinimum",
      gap: value != null && target != null ? Math.max(0, target - value) : null,
    };
  }
  values.moisture = {
    value: sensor.values.moisture,
    unit: "%",
    source: sensor.values.moisture == null ? "notAvailable" : sensor.source,
    status:
      sensor.values.moisture == null
        ? "notAvailable"
        : sensor.values.moisture > (input.feedType === "maize_silage" ? 70 : 15)
          ? "highValue"
          : sensor.source === "virtual"
            ? "simulated"
            : "entered",
  };
  values.minerals = {
    value: null,
    source: "notTested",
    status: "requiresTesting",
  };
  return {
    values,
    animalType: input.animalType || "unspecified",
    contextAdvice: profile.advice,
    scope: "ingredient-minimum-only",
    reference,
    completeRation: false,
  };
}
export function buildReport(
  input,
  { fqi = null, batchId = null, timestamp = new Date().toISOString() } = {},
) {
  return withGoal(
    enrichReport(assess(input, { allowMissing: true }), input, {
      fqi,
      batchId,
      timestamp,
    }),
    input.goal || "general",
  );
}
function enrichReport(base, input, { fqi = null, batchId = null, timestamp }) {
  const n = nutrition(input, base.sensor);
  const safetyConcern =
    input.mould === true ||
    input.foreignMaterial === true ||
    base.risk === "high";
  const storageFlags = base.reasons.filter((r) =>
    ["storage", "freshness"].includes(r.domain),
  );
  const storageKnown = [
    "temperature",
    "humidity",
    "moisture",
    ...(input.feedType === "maize_silage" ? ["ph"] : []),
  ].every((k) => base.sensor.values[k] != null);
  const blocked = safetyConcern
    ? "safety"
    : storageFlags.length
      ? "storage"
      : base.risk === "unknown"
        ? "information"
        : null;
  const suggestions = blocked
    ? [
        blocked === "safety"
          ? "nutritionBlocked"
          : blocked === "storage"
            ? "storageFirst"
            : "needChecks",
      ]
    : [
        ...(n.values.protein.status === "belowTarget"
          ? ["proteinSuggestion"]
          : []),
        ...(n.values.fiber.status === "belowTarget" ? ["fiberSuggestion"] : []),
        "rationGuidance",
        n.contextAdvice,
      ];
  const storageRisk =
    storageFlags.reduce((s, r) => s + r.points, 0) >= 50
      ? "high"
      : storageFlags.length
        ? "moderate"
        : storageKnown
          ? "low"
          : "unknown";
  const observationSource =
    input.observationSource === "virtual" ? "virtual" : "farmerObservation";
  const safety = {
    status: safetyConcern
      ? "high"
      : base.risk === "unknown"
        ? "unknown"
        : "notCleared",
    visibleImageAnalysis: "analysisUnavailable",
    spoilageRisk: input.mould === true ? "high" : storageRisk,
    items: [
      {
        key: "visibleMould",
        status:
          input.mould === true
            ? "reportedIndicator"
            : input.mould === false
              ? "notReported"
              : "notTested",
        source: observationSource,
      },
      {
        key: "fungal",
        status: input.mould === true ? "predictedRisk" : "notTested",
        source: input.mould === true ? "ruleAssessment" : "notTested",
      },
      {
        key: "toxins",
        status: "labConfirmation",
        source: "notTested",
      },
      { key: "urea", status: "notTested", source: "notTested" },
      { key: "sand", status: "notTested", source: "notTested" },
      { key: "salt", status: "notTested", source: "notTested" },
      {
        key: "foreignMaterial",
        status:
          input.foreignMaterial === true ? "reportedIndicator" : "notTested",
        source: observationSource,
      },
    ],
  };
  return {
    ...base,
    schemaVersion: 2,
    animalContext: animalContext(input),
    nirReference:
      typeof input.nirReference === "string"
        ? input.nirReference.trim().slice(0, 160)
        : null,
    image: input.image
      ? {
          name: input.image.name,
          width: input.image.width,
          height: input.image.height,
          warning: input.image.warning || null,
          analysis: "unavailable",
        }
      : null,
    timestamp,
    batchId,
    fqi,
    overall: {
      score: base.score,
      status: base.risk,
      message:
        base.risk === "high"
          ? "doNotUse"
          : base.risk === "unknown"
            ? "needChecks"
            : base.reasons.length
              ? "checkBeforeUse"
              : "availableChecksOnly",
    },
    nutrition: n,
    safety,
    storage: {
      readings: base.sensor.values,
      source: base.sensor.source,
      timestamp,
      flags: storageFlags,
      risk: storageRisk,
      advice: storageFlags.length
        ? ["storageAdvice", "inspect", "retest"]
        : ["monitor"],
      complete: storageKnown,
    },
    silage:
      input.feedType === "maize_silage"
        ? {
            ph: base.sensor.values.ph,
            moisture: base.sensor.values.moisture,
            fermentation: fqi ? "estimated" : "insufficient",
            fqi: fqi?.value ?? null,
            spoilageRisk: base.risk,
          }
        : null,
    recommendations: {
      priority: blocked || "nutrition",
      immediate: safetyConcern
        ? ["doNotUse", "isolate", "noMix", "confirm"]
        : storageFlags.length
          ? ["inspect", "storageAdvice"]
          : ["monitor", "notCertificate"],
      why: base.reasons.map((r) => r.key),
      retest: "retest",
    },
    feedSuggestions: {
      blocked: !!blocked,
      reason: blocked,
      items: suggestions,
    },
    confidence: null,
    limitations: [
      "notCertificate",
      "photoLimit",
      "nutritionScope",
      "nirUnavailable",
    ],
  };
}
// Existing immutable test snapshots retain their historical score and advice.
// New cards are projected from the values recorded with the test, never today's inputs.
export function asReport(
  result,
  input = {},
  timestamp = new Date().toISOString(),
  batchId = null,
) {
  if (result.schemaVersion === 2) return result;
  const safeInput = {
    ...result.sensor.values,
    ...input,
    feedType: input.feedType || "maize_silage",
    source: result.sensor.source,
  };
  return {
    ...enrichReport(result, safeInput, { fqi: result.fqi, batchId, timestamp }),
    legacy: true,
  };
}
export function passportSummary(batch, test) {
  const report = asReport(test.result, test.input, test.createdAt, batch.id);
  return {
    app: "FeedSight",
    batch: batch.id,
    feed: batch.feedType,
    tested: report.timestamp,
    score: report.overall.score,
    status: report.overall.status,
    safety: report.safety.status,
    source: report.storage.source,
    goal: report.goal?.selected || null,
    suitability: report.goal?.status || "goalNotRecorded",
    note: "Screening only; not certified",
  };
}
export function storageTrend(tests) {
  const rows = [...tests].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  if (rows.length < 2) return [];
  const [before, after] = rows
    .slice(-2)
    .map((r) => asReport(r.result, r.input, r.createdAt, r.batchId));
  if (before.storage.source !== after.storage.source) return [];
  return ["humidity", "moisture"].filter(
    (k) =>
      before.storage.readings[k] != null &&
      after.storage.readings[k] != null &&
      after.storage.readings[k] > before.storage.readings[k],
  );
}
