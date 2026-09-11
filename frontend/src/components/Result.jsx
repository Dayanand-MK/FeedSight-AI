import { useState } from "react";
import GoalPicker from "./GoalPicker.jsx";
import { goalProfiles } from "../config/goalProfiles.js";
import { withGoal } from "../services/goals.js";
import { asReport } from "../services/report.js";
import SpeechReport from "./SpeechReport.jsx";
import NutrientBalance from "./NutrientBalance.jsx";
import {
  BiomassChart,
  NutritionChart,
  FqiGauge,
  NutrientRadarChart,
  StorageRiskMatrix,
} from "./AnalysisCharts.jsx";
import VisionInspection from "./VisionInspection.jsx";
export default function Result({
  result,
  t,
  lang = "en",
  onSave,
  onGoalChange,
  saved,
  busy,
}) {
  const [comparison, setComparison] = useState(null);
  const baseReport = asReport(result);
  const report = comparison
      ? {
          ...withGoal(baseReport, comparison),
          comparisonOnly: true,
          savedGoal: baseReport.goal?.selected || null,
        }
      : baseReport.goal
        ? baseReport
        : { ...withGoal(baseReport, "general"), goalProjected: true },
    { overall, nutrition, safety, storage, recommendations, feedSuggestions } =
      report;
  const icons = { low: "✓", moderate: "⚠", high: "⛔", unknown: "?" };
  function exportReport() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedsight-report-${report.timestamp.slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="result card" aria-label={t("result")}>
      {report.legacy && <p className="notice">{t("legacyReport")}</p>}
      <div className="result-top">
        <div>
          <p className="eyebrow">{t("canUse")}</p>
          <h2>{t("score")}</h2>
          <span className={`badge ${overall.status}`}>
            {icons[overall.status]} {t(overall.status)}
          </span>
        </div>
        <div className={`score ${overall.status}`}>
          <FqiGauge score={overall.score} status={overall.status} t={t} />
        </div>
      </div>
      <p className="use-verdict">{t(overall.message)}</p>
      <VisionInspection
        image={report.image || result?.image}
        pastureAnalysis={report.pastureAnalysis}
        feedType={
          report.feedIdentification?.feedType ||
          report.feedType ||
          result?.feedType
        }
        t={t}
      />
      {report.feedIdentification && (
        <p>
          {t(
            report.feedIdentification.confirmed
              ? "feedConfirmed"
              : "feedManual",
          )}
          : {t(report.feedIdentification.feedType)}
        </p>
      )}
      {report.pastureAnalysis && (
        <details>
          <summary>{t("pastureTitle")}</summary>
          <p>{t("pastureExperimental")}</p>
          {Object.entries(report.pastureAnalysis.predictions).map(
            ([key, value]) => (
              <p key={key}>
                {t(key)}: {value.toFixed(1)} g
              </p>
            ),
          )}
          <p>{t("pastureUncertainty")}</p>
          <BiomassChart value={report.pastureAnalysis} t={t} />
        </details>
      )}
      {overall.score == null && <p>{t("scoreUnavailable")}</p>}
      <p className="notice">
        {t("screening")}
        {storage.source === "virtual" && <> · {t("virtual")}</>}
      </p>
      <section className="goal-summary" aria-label={t("goalSuitability")}>
        <p className="eyebrow">{t("yourGoal")}</p>
        <h2>
          {goalProfiles[report.goal.selected].icon}{" "}
          {t(goalProfiles[report.goal.selected].label)}
        </h2>
        <strong>{t(report.goal.status)}</strong>
        <p>{t(report.goal.explanation)}</p>
        {(comparison || (!onGoalChange && !baseReport.goal)) && (
          <p className="notice">{t("goalComparison")}</p>
        )}
        {!baseReport.goal && <p>{t("goalNotRecorded")}</p>}
        <details>
          <summary>{t("changeGoal")}</summary>
          <GoalPicker
            value={report.goal.selected}
            t={t}
            onChange={(goal) => {
              if (onGoalChange) {
                setComparison(null);
                onGoalChange(goal);
              } else setComparison(goal);
            }}
          />
        </details>
      </section>
      <SpeechReport report={report} t={t} lang={lang} />
      <NutrientBalance balance={report.nutrientBalance} t={t} />
      <div className="nutrition-charts-grid">
        <NutritionChart nutrition={nutrition} t={t} />
        <NutrientRadarChart nutrition={nutrition} t={t} />
      </div>
      <div className="requirement-cards">
        <section
          className="requirement-card"
          aria-label={t("nutritionQuality")}
        >
          <h3>🥗 {t("nutritionQuality")}</h3>
          <p>{t("nutritionQuestion")}</p>
          {nutrition.composition?.sourceType === "UNKNOWN" && (
            <p>{t("compositionUnavailable")}</p>
          )}
          <dl>
            {["protein", "moisture", "fiber", "energy", "minerals"].map((k) => {
              const row = nutrition.values[k];
              return (
                <div key={k}>
                  <dt>{t(k)}</dt>
                  <dd>
                    <strong>
                      {row.value == null
                        ? t(row.status)
                        : `${row.value} ${row.unit}`}
                    </strong>
                    <small>
                      {t(row.source)}
                      {row.value != null && <> · {t(row.status)}</>}
                    </small>
                  </dd>
                </div>
              );
            })}
          </dl>
          <details>
            <summary>{t("nutritionGap")}</summary>
            <p>{t("nutritionScope")}</p>
            <p>{t(nutrition.animalType)}</p>
            {["protein", "fiber", "energy"].map((k) => (
              <p key={k}>
                <strong>{t(k)}:</strong> {t(nutrition.values[k].status)}
                {nutrition.values[k].gap != null && (
                  <>
                    {" "}
                    · {nutrition.values[k].gap.toFixed(1)} {t("gapPoints")}
                  </>
                )}
              </p>
            ))}
            {nutrition.reference && (
              <p>
                {t("targetReference")}: {nutrition.reference}
              </p>
            )}
          </details>
        </section>
        <section className="requirement-card" aria-label={t("feedSafety")}>
          <h3>🛡 {t("feedSafety")}</h3>
          <p>{t("safetyQuestion")}</p>
          <h4>{t("adulterationTitle")}</h4>
          <p>
            {t("visibleAnalysis")}:{" "}
            {t(safety.visibleImageAnalysis || "analysisUnavailable")}
          </p>
          <p>
            {t("spoilageRisk")}: {t(safety.spoilageRisk || storage.risk)}
          </p>
          <dl>
            {safety.items.map((item) => (
              <div key={item.key}>
                <dt>{t(item.key)}</dt>
                <dd>
                  <strong>
                    {[
                      "reportedIndicator",
                      "predictedRisk",
                      "labConfirmation",
                    ].includes(item.status)
                      ? "⚠ "
                      : "○ "}
                    {t(item.status)}
                  </strong>
                  <small>{t(item.source)}</small>
                </dd>
              </div>
            ))}
          </dl>
          <details>
            <summary>{t("reportDetails")}</summary>
            <p>{t("photoLimit")}</p>
            <p>{t("confirm")}</p>
          </details>
        </section>
        <section className="requirement-card" aria-label={t("yourGoal")}>
          <h3>🎯 {t("yourGoal")}</h3>
          <p>{t("goalQuestion")}</p>
          <strong>{t(report.goal.status)}</strong>
          <p>{t("goalLimit")}</p>
          <h4>{t("why")}</h4>
          <ul>
            {report.goal.findings.map((finding, i) => (
              <li key={`${finding.key}-${i}`}>
                {t(finding.key)}{" "}
                <small>
                  {t(finding.impact)} · {t(finding.source)}
                  {finding.reference && <> · {finding.reference}</>}
                </small>
              </li>
            ))}
          </ul>
        </section>
        <section className="requirement-card" aria-label={t("storageMonitor")}>
          <h3>🏠 {t("storageMonitor")}</h3>
          <p>{t("storageQuestion")}</p>
          <span className={`badge ${storage.risk}`}>
            {icons[storage.risk]} {t(storage.risk)}
          </span>
          <dl>
            {Object.entries(storage.readings)
              .filter(([k]) => k !== "ph" || report.silage)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{t(k)}</dt>
                  <dd>{v ?? t("notAvailable")}</dd>
                </div>
              ))}
          </dl>
          <small>
            {t(storage.source)} · {t("lastUpdated")}:{" "}
            {new Date(storage.timestamp).toLocaleString()}
          </small>
          <details>
            <summary>{t("storageAdviceTitle")}</summary>
            <ul>
              {storage.advice.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </details>
          <StorageRiskMatrix storage={storage} silage={report.silage} t={t} />
          {report.silage && (
            <details>
              <summary>{t("silageCondition")}</summary>
              <p>
                {t("fermentation")}: {t(report.silage.fermentation)}
              </p>
              {report.fqi && (
                <p>
                  {t("labResult")}: {report.fqi.value.toFixed(2)}
                </p>
              )}
              <p>{t(report.silage.spoilageRisk)}</p>
            </details>
          )}
        </section>
      </div>
      <section className="requirement-card" aria-label={t("whatToDo")}>
        <h3>🐄 {t("whatToDo")}</h3>
        <strong>{t("immediateAction")}</strong>
        <ul>
          {recommendations.immediate.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <details open={feedSuggestions.blocked}>
          <summary>{t("feedImprovements")}</summary>
          <ul>
            {feedSuggestions.items.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>{t("whenRetest")}</summary>
          <p>{t(recommendations.retest)}</p>
        </details>
      </section>
      <section className="goal-actions">
        <h3>
          {t("yourGoal")}: {t("whatToDo")}
        </h3>
        <ol>
          {report.goal.recommendations.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
      </section>
      <details className="score-explanation">
        <summary>{t("why")}</summary>
        {report.reasons.length ? (
          <ul className="reasons">
            {report.reasons.map((r) => (
              <li key={r.key}>
                <span>{t(r.key)}</span>
                <strong>−{r.points}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t(overall.score == null ? "needChecks" : "noFlags")}</p>
        )}
        {overall.score != null && (
          <p>
            100 − {report.reasons.reduce((s, r) => s + r.points, 0)} →{" "}
            {overall.score}/100
          </p>
        )}
      </details>
      <div className="button-row">
        {onSave && (
          <button className="primary" onClick={onSave} disabled={saved || busy}>
            {busy ? t("busy") : saved ? t("saved") : t("save")}
          </button>
        )}
        <button className="quiet" onClick={exportReport}>
          {t("exportReport")}
        </button>
      </div>
      <p className="muted">{t("disclaimer")}</p>
    </section>
  );
}
