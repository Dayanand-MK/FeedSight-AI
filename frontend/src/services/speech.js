import { goalProfiles } from "../config/goalProfiles.js";
export const voiceLanguages = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };
export function localVoice(voices, lang) {
  return (
    voices.find(
      (v) =>
        v.localService &&
        v.lang.toLowerCase() === voiceLanguages[lang]?.toLowerCase(),
    ) ||
    voices.find(
      (v) => v.localService && v.lang.toLowerCase().split("-")[0] === lang,
    ) ||
    null
  );
}
export function spokenReport(report, t) {
  const lines = [
    t("spokenIntro"),
    report.overall.score == null
      ? t("scoreUnavailable")
      : `${t("score")}: ${report.overall.score} ${t("outOf100")}.`,
    t(report.overall.message),
  ];
  if (report.goal)
    lines.push(
      t("yourGoal"),
      t(goalProfiles[report.goal.selected].label),
      t(report.goal.status),
      t(report.goal.explanation),
      ...report.goal.recommendations.map(t),
    );
  if (
    report.storage.source === "virtual" ||
    report.safety.items.some((item) => item.source === "virtual")
  )
    lines.splice(1, 0, t("simulationNote"));
  if (report.recommendations.why.length)
    lines.push(t("why"), ...report.recommendations.why.map(t));
  lines.push(
    t("feedSafety"),
    t("notCertificate"),
    t("storageMonitor"),
    t(report.storage.risk),
  );
  lines.push(t("immediateAction"), ...report.recommendations.immediate.map(t));
  lines.push(t("nutritionQuality"));
  for (const k of ["protein", "fiber"]) {
    const row = report.nutrition.values[k];
    lines.push(
      `${t(k)}: ${row.value == null ? t("notAvailable") : `${row.value} ${t("percentDM")}. ${t(row.status)}`}.`,
    );
  }
  lines.push(
    t("feedImprovements"),
    ...report.feedSuggestions.items.map(t),
    t("retest"),
  );
  return lines.join(" ");
}
