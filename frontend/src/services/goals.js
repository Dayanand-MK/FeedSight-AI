import { nutrientBalance } from "./nutrientBalance.js";
import {
  goalProfiles,
  goalRuleVersion,
  animalFields,
  animalStages,
  reproductiveStates,
} from "../config/goalProfiles.js";

export function animalContext(input) {
  const context = { animalType: input.animalType || "unspecified" };
  if (
    !["unspecified", "lactating", "dryCow", "heifer", "calf"].includes(
      context.animalType,
    )
  )
    throw new Error("invalidInput");
  for (const [key, [min, max]] of Object.entries(animalFields)) {
    const raw = input.animalContext?.[key];
    const missing =
      raw == null || (typeof raw === "string" && raw.trim() === "");
    if (
      !missing &&
      ((typeof raw !== "number" && typeof raw !== "string") ||
        !Number.isFinite(Number(raw)) ||
        Number(raw) < min ||
        Number(raw) > max)
    )
      throw new Error("invalidInput");
    context[key] = missing ? null : Number(raw);
  }
  context.lactationStage = input.animalContext?.lactationStage || "unknown";
  context.reproductiveStatus =
    input.animalContext?.reproductiveStatus || "unknown";
  if (
    !animalStages.includes(context.lactationStage) ||
    !reproductiveStates.includes(context.reproductiveStatus)
  )
    throw new Error("invalidInput");
  if (context.animalType !== "lactating") {
    context.milkYield = null;
    context.lactationStage = "unknown";
  }
  return context;
}

export function evaluateGoal(report, selected = "general") {
  if (!Object.hasOwn(goalProfiles, selected)) throw new Error("invalidInput");
  const profile = goalProfiles[selected];
  const context = report.animalContext || {
    animalType: report.nutrition.animalType || "unspecified",
  };
  const safety =
    report.safety.status === "high" || report.overall.status === "high";
  const storage = report.storage.flags.length > 0;
  const gaps = ["protein", "fiber"].filter(
    (k) => report.nutrition.values[k].status === "belowTarget",
  );
  const missingContext = context.animalType === "unspecified";
  const mismatch =
    profile.animalTypes &&
    !missingContext &&
    !profile.animalTypes.includes(context.animalType);
  const priority = safety
    ? "safety"
    : storage
      ? "storage"
      : report.overall.score == null
        ? "information"
        : gaps.length
          ? "nutrition"
          : "goal";
  const findings = report.reasons.map((r) => ({
    key: r.key,
    impact:
      r.domain === "safety" ||
      r.domain === "storage" ||
      r.domain === "freshness"
        ? "impactHigh"
        : "impactMedium",
    source: "ruleAssessment",
  }));
  for (const key of gaps)
    findings.push({
      key: `${key}GoalGap`,
      impact: "impactMedium",
      source: "entered",
      reference: report.nutrition.values[key].reference,
    });
  if (missingContext && selected !== "general")
    findings.push({
      key: "goalContextMissing",
      impact: "informationNeeded",
      source: "notAvailable",
    });
  if (mismatch)
    findings.push({
      key: "goalAnimalMismatch",
      impact: "informationNeeded",
      source: "entered",
    });
  findings.push({
    key: "goalRequirementsMissing",
    impact: "informationNeeded",
    source: "notAvailable",
  });
  findings.push({
    key: "goalEnergyMineralsUnknown",
    impact: "informationNeeded",
    source: "notTested",
  });
  const blocked = ["safety", "storage", "information"].includes(priority);
  const recommendations = safety
    ? ["goalSafetyStop", "isolate", "noMix", "confirm"]
    : storage
      ? ["storageFirst", "storageAdvice", "inspect", "retest"]
      : priority === "information"
        ? ["needChecks", "goalGeneralAdvice"]
        : [
            ...(gaps.includes("protein") ? ["proteinSuggestion"] : []),
            ...(gaps.includes("fiber") ? ["fiberSuggestion"] : []),
            mismatch ? "goalAnimalMismatch" : profile.advice,
            "rationGuidance",
          ];
  if (selected === "profit" && !safety)
    recommendations.push(storage ? "goalWaste" : "goalAvoidExtras");
  return {
    selected,
    version: goalRuleVersion,
    score: null,
    status: safety
      ? "goalBlocked"
      : storage || gaps.length
        ? "goalAttention"
        : "goalUnknown",
    priority,
    blocked,
    findings,
    recommendations: [...new Set(recommendations)],
    explanation: safety
      ? "goalSafetyStop"
      : storage
        ? "storageFirst"
        : mismatch
          ? "goalAnimalMismatch"
          : gaps.length
            ? "goalGapScope"
            : "goalRequirementsMissing",
    animalContext: context,
    scope: "qualitative-support-not-ration",
    requirementsReference: null,
    economics: { costDataAvailable: false, savings: null },
  };
}

// Only the goal decision changes: preserve measurements, inference, timestamps and safety.
export function withGoal(report, selected) {
  const goal = evaluateGoal(report, selected);
  return { ...report, goal, nutrientBalance: nutrientBalance(report, goal) };
}

export function goalHistory(tests) {
  return [...tests]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((row) => ({
      id: row.id,
      timestamp: row.createdAt,
      source: row.result.storage?.source || row.result.sensor?.source,
      selected: row.result.goal?.selected || null,
      status: row.result.goal?.status || "goalNotRecorded",
      priority: row.result.goal?.priority || null,
    }));
}
