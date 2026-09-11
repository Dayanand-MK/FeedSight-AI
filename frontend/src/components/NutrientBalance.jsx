import { useState } from "react";
import { goalProfiles } from "../config/goalProfiles.js";
export default function NutrientBalance({ balance, t }) {
  const [nutrient, setNutrient] = useState("protein"),
    [optionId, setOptionId] = useState(null);
  if (!balance) return null;
  const row = balance.rows.find((r) => r.key === nutrient) || balance.rows[0];
  const choices = balance.options.filter((o) => o.addresses.includes(row.key));
  const selected = choices.find((o) => o.id === optionId) || null;
  return (
    <section
      className="analysis-chart nutrient-balance"
      aria-label={t("balanceTitle")}
    >
      <h2>🥗 {t("balanceTitle")}</h2>
      <p>{t("balanceScope")}</p>
      {balance.blocked && (
        <p className="notice" role="status">
          {t(balance.reason)}
        </p>
      )}
      <div className="component-bars">
        {balance.rows.map((r) => (
          <button
            type="button"
            className="component-row"
            aria-pressed={row.key === r.key}
            key={r.key}
            onClick={() => {
              setNutrient(r.key);
              setOptionId(null);
            }}
          >
            <span>{t(r.key)}</span>
            <strong>{t(r.status)}</strong>
          </button>
        ))}
      </div>
      <p role="status">{t(row.reason)}</p>
      <details>
        <summary>{t("reportDetails")}</summary>
        <p>
          {t(row.key)}: {row.value ?? "—"} {row.unit}
        </p>
        <p>
          {t("targetReference")}: {row.target ?? "—"}{" "}
          {row.targetUnit || row.unit}
        </p>
        <p>{row.reference || t("balanceMissingTarget")}</p>
        <p>
          {t("source")}: {t(row.provenance)}
        </p>
        {row.gap != null && (
          <p>
            {row.gap.toFixed(1)} {t("gapPoints")}
          </p>
        )}
      </details>
      <h3>🐄 {t("balanceWhatAdd")}</h3>
      {choices.length ? (
        <>
          <div className="chart-controls">
            {choices.map((option) => (
              <button
                type="button"
                key={option.id}
                aria-pressed={selected?.id === option.id}
                onClick={() => setOptionId(option.id)}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
          {selected && (
            <div className="notice">
              <h4>{t(selected.label)}</h4>
              <p>
                {t("yourGoal")}: {t(goalProfiles[balance.selectedGoal].label)}
              </p>
              <p>{t(selected.role)}</p>
              <p>{t(selected.caution)}</p>
              <a href={selected.url} target="_blank" rel="noreferrer">
                {selected.source}
              </a>
              <h4>{t("balancePotential")}</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("chartMetric")}</th>
                      <th>{t("balanceCurrent")}</th>
                      <th>{t("balancePotential")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.rows.map((r) => (
                      <tr key={r.key}>
                        <td>{t(r.key)}</td>
                        <td>{t(r.status)}</td>
                        <td>
                          {t(
                            selected.addresses.includes(r.key)
                              ? "balancePotentialRole"
                              : "balanceNotEvaluated",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{t("balanceNoAfter")}</p>
            </div>
          )}
          <details>
            <summary>{t("balanceAlternatives")}</summary>
            <p>{t("balanceAlternativeScope")}</p>
            {choices.map((o) => (
              <p key={o.id}>
                {t(o.label)} — {t(o.role)}
              </p>
            ))}
          </details>
        </>
      ) : (
        <p>
          {t(
            balance.blocked
              ? balance.reason
              : row.status === "balanceMeets"
                ? "balanceNoCorrection"
                : "balanceNoOptions",
          )}
        </p>
      )}
      <p className="chart-note">{t("balanceUnsupported")}</p>
      <p className="chart-note">{t("balanceProfessional")}</p>
    </section>
  );
}
