import { feedComplements } from "../config/feedComplements.js";
import { nutrientFields } from "../config/nutritionProfiles.js";
export function compareNutrient(row, expectedUnit) {
  const numeric = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (!row || !numeric(row.value))
    return {
      status: "balanceUnknown",
      gap: null,
      reason: "balanceMissingValue",
    };
  if (!numeric(row.target) || !row.reference?.trim())
    return {
      status: "balanceUnknown",
      gap: null,
      reason: "balanceMissingTarget",
    };
  if (
    row.unit !== expectedUnit ||
    (row.targetUnit || row.unit) !== expectedUnit
  )
    return { status: "balanceUnavailable", gap: null, reason: "balanceUnits" };
  return {
    status: row.value < row.target ? "balanceGap" : "balanceMeets",
    gap: Math.max(0, row.target - row.value),
    reason: row.value < row.target ? "balanceGapScope" : "balanceNoCorrection",
  };
}
export function nutrientBalance(report, goal) {
  const priorities =
    goal.selected === "health"
      ? ["fiber", "protein", "energy"]
      : ["protein", "energy", "fiber"];
  const rows = priorities.map((key) => {
    const row = report.nutrition.values[key];
    return {
      key,
      ...compareNutrient(row, nutrientFields[key].unit),
      value: row?.value ?? null,
      target: row?.target ?? null,
      unit: row?.unit || nutrientFields[key].unit,
      targetUnit: row?.targetUnit || row?.unit,
      reference: row?.reference || null,
      provenance:
        row?.value == null
          ? "UNKNOWN"
          : row.provenance === "USER_REPORTED"
            ? "FARMER_INPUT"
            : row.provenance || "FARMER_INPUT",
    };
  });
  const animal =
    report.animalContext?.animalType || report.nutrition.animalType;
  const stop =
    report.safety.status === "high" || report.overall.status === "high"
      ? "balanceSafetyStop"
      : report.storage.flags.length
        ? "storageFirst"
        : report.feedSuggestions.blocked
          ? "balanceChecksFirst"
          : ["unspecified", "calf"].includes(animal)
            ? "balanceContextNeeded"
            : goal.selected === "milk" && animal !== "lactating"
              ? "goalAnimalMismatch"
              : null;
  const gaps = rows
    .filter((row) => row.status === "balanceGap")
    .map((row) => row.key);
  const options = stop
    ? []
    : feedComplements
        .filter(
          (option) =>
            option.suitableFor.includes(animal) &&
            option.supports.some((k) => gaps.includes(k)),
        )
        .map((option) => ({
          ...option,
          addresses: option.supports.filter((k) => gaps.includes(k)),
          rank: option.supports.reduce(
            (s, k) =>
              s +
              (gaps.includes(k)
                ? priorities.length - priorities.indexOf(k)
                : 0),
            0,
          ),
        }))
        .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id))
        .slice(0, 3);
  return {
    version: "balance-1",
    selectedGoal: goal.selected,
    animalContext: report.animalContext,
    scope: "user-referenced-ingredient-minimum-not-animal-requirement",
    requirementSource: "USER_SUPPLIED_BENCHMARK",
    animalRequirementsAvailable: false,
    rows,
    blocked: !!stop,
    reason: stop,
    options,
    unsupported: ["minerals", "calcium", "phosphorus", "dryMatterRequirement"],
    exactRationAvailable: false,
  };
}
