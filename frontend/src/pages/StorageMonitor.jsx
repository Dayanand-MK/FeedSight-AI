import { goalProfiles } from "../config/goalProfiles.js";
import { useState } from "react";
import { storageTrend } from "../services/report.js";
import { HistoryChart } from "../components/AnalysisCharts.jsx";
export default function StorageMonitor({ t, batches, tests, onRecord }) {
  const [id, setId] = useState(batches[0]?.id || "");
  const rows = tests.filter((r) => r.batchId === id),
    last = rows.at(-1),
    report = last?.result;
  return (
    <>
      <div className="page-heading">
        <h1>{t("storageMonitor")}</h1>
        <p>{t("storageQuestion")}</p>
      </div>
      <section className="card">
        <label>
          {t("history")}
          <select value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">{t("newBatch")}</option>
            {batches.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary" onClick={() => onRecord(id || null)}>
          {t("recordReading")} →
        </button>
        {report ? (
          <>
            <p className="notice">
              {t(report.storage.source)} · {t("lastUpdated")}:{" "}
              {new Date(report.timestamp).toLocaleString()}
            </p>
            <span className={`badge ${report.storage.risk}`}>
              {report.storage.risk === "high"
                ? "⛔"
                : report.storage.risk === "low"
                  ? "✓"
                  : "⚠"}{" "}
              {t(report.storage.risk)}
            </span>
            <div className="storage-tiles">
              {Object.entries(report.storage.readings)
                .filter(([k]) => k !== "ph" || report.silage)
                .map(([key, value]) => (
                  <div className="card" key={key}>
                    <span>{t(key)}</span>
                    <strong>{value ?? "—"}</strong>
                  </div>
                ))}
            </div>
            {report.goal && (
              <p>
                {t("yourGoal")}: {t(goalProfiles[report.goal.selected]?.label)}{" "}
                · {t(report.goal.status)}
              </p>
            )}
            <h2>{t("storageAdviceTitle")}</h2>
            <ul>
              {report.storage.advice.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
            {storageTrend(rows).length > 0 && (
              <p role="status" className="notice">
                {t("storageWorsening")}
              </p>
            )}
            <h2>{t("twin")}</h2>
            <HistoryChart tests={rows} t={t} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "lastUpdated",
                      "source",
                      "humidity",
                      "moisture",
                      "temperature",
                      "ph",
                      "storageAge",
                      "score",
                    ].map((k) => (
                      <th key={k}>{t(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.createdAt).toLocaleString()}</td>
                      <td>{t(row.result.storage.source)}</td>
                      {[
                        "humidity",
                        "moisture",
                        "temperature",
                        "ph",
                        "storageAge",
                      ].map((k) => (
                        <td key={k}>{row.result.storage.readings[k] ?? "—"}</td>
                      ))}
                      <td>{row.result.overall.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>{t("empty")}</p>
        )}
      </section>
    </>
  );
}
