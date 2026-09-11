import { goalHistory } from "../services/goals.js";
import { goalProfiles } from "../config/goalProfiles.js";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { declining } from "../services/assessment.js";
import { passportSummary, storageTrend } from "../services/report.js";
import Result from "../components/Result.jsx";
export default function History({ t, lang, batches, tests }) {
  const [selected, setSelected] = useState(null),
    [qr, setQr] = useState("");
  const batch = batches.find((b) => b.id === selected);
  const entries = tests.filter((v) => v.batchId === selected);
  const last = entries.at(-1);
  useEffect(() => {
    let active = true;
    setQr("");
    if (batch && last)
      QRCode.toDataURL(JSON.stringify(passportSummary(batch, last)), {
        width: 256,
        margin: 2,
      })
        .then((v) => {
          if (active) setQr(v);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [selected, last?.id]);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">{t("twin")}</p>
        <h1>{t("history")}</h1>
      </div>
      {!batches.length && <p className="card">{t("empty")}</p>}
      <div className="batch-grid">
        {batches.map((b) => {
          const rows = tests.filter((r) => r.batchId === b.id),
            latest = rows.at(-1);
          return (
            <button
              className={`card batch-card ${selected === b.id ? "selected" : ""}`}
              key={b.id}
              onClick={() => setSelected(b.id)}
            >
              <span>{t(b.feedType)}</span>
              <h2>{b.name}</h2>
              <div className="batch-score">
                {latest?.result.score ?? "—"}
                <small>/100</small>
              </div>
              <span className={`badge ${latest?.result.risk}`}>
                {t(latest?.result.risk)}
              </span>
              <p>
                {rows.length} · {t("total")}
              </p>
            </button>
          );
        })}
      </div>
      {batch && last && (
        <section className="card twin">
          <h2>
            {batch.name} · {t("twin")}
          </h2>
          <code>{batch.id}</code>
          <p>{new Date(batch.createdAt).toLocaleString()}</p>
          {declining(entries) && <p className="notice">{t("decline")}</p>}
          {storageTrend(entries).length > 0 && (
            <p className="notice">{t("storageWorsening")}</p>
          )}
          <section aria-label={t("goalTrend")}>
            <h3>{t("goalTrend")}</h3>
            <p>{t("goalTrendHelp")}</p>
            <ol>
              {goalHistory(entries).map((row) => (
                <li key={row.id}>
                  {new Date(row.timestamp).toLocaleString()} ·{" "}
                  {row.selected
                    ? t(goalProfiles[row.selected]?.label || "goalGeneral")
                    : t("goalNotRecorded")}{" "}
                  → {t(row.status)} · {t(row.source)}
                </li>
              ))}
            </ol>
          </section>
          <h3>{t("trend")}</h3>
          <div className="trend" aria-label={t("trend")}>
            {entries.map((row) => (
              <div key={row.id}>
                <strong>{row.result.score ?? "—"}</strong>
                {row.result.score != null && (
                  <div
                    className={`bar ${row.result.risk}`}
                    style={{ height: `${Math.max(4, row.result.score)}px` }}
                  />
                )}
                <small>{new Date(row.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("total")}</th>
                  <th>{t("score")}</th>
                  <th>{t("source")}</th>
                  <th>{t("temperature")}</th>
                  <th>{t("humidity")}</th>
                  <th>{t("moisture")}</th>
                  <th>{t("ph")}</th>
                  <th>{t("cloud")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>
                      {row.result.score ?? "—"} · {t(row.result.risk)}
                    </td>
                    <td>{t(row.result.sensor.source)}</td>
                    <td>{row.result.sensor.values.temperature}</td>
                    <td>{row.result.sensor.values.humidity}</td>
                    <td>{row.result.sensor.values.moisture}</td>
                    <td>{row.result.sensor.values.ph}</td>
                    <td>{t(row.syncStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="two-cols">
            <div>
              <h3>{t("passport")}</h3>
              {qr && (
                <img src={qr} width="256" height="256" alt={t("passport")} />
              )}
              <p className="muted">{t("qrNote")}</p>
            </div>
            <Result t={t} lang={lang} result={last.result} />
          </div>
          <details>
            <summary>{t("history")}</summary>
            {entries
              .slice(0, -1)
              .reverse()
              .map((row) => (
                <div key={row.id}>
                  <p>{new Date(row.createdAt).toLocaleString()}</p>
                  <Result result={row.result} t={t} lang={lang} />
                </div>
              ))}
          </details>
        </section>
      )}
    </>
  );
}
