import { useEffect, useRef, useState } from "react";
import { predictBiomass } from "../services/biomass.js";
import { BiomassChart } from "./AnalysisCharts.jsx";
export default function PastureAnalysis({ file, value, onResult, t }) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setAccepted(false);
    setBusy(false);
    setFailed(false);
    return () => {
      generation.current++;
    };
  }, [file]);
  async function run() {
    const current = ++generation.current;
    setBusy(true);
    setFailed(false);
    try {
      const result = await predictBiomass(file);
      if (generation.current === current) onResult(result);
    } catch {
      if (generation.current === current) setFailed(true);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }
  return (
    <details>
      <summary>{t("pastureTitle")}</summary>
      <p>{t("pastureLimit")}</p>
      <label>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        {t("pastureScope")}
      </label>
      <button type="button" disabled={!accepted || busy || !file} onClick={run}>
        {t(busy ? "checking" : "pastureRun")}
      </button>
      {failed && <p role="status">{t("pastureFailed")}</p>}
      {value && (
        <>
          <p>{t("pastureExperimental")}</p>
          <dl>
            {Object.entries(value.predictions).map(([key, val]) => (
              <div key={key}>
                <dt>{t(key)}</dt>
                <dd>{val.toFixed(1)} g</dd>
              </div>
            ))}
          </dl>
          <p>{t("pastureUncertainty")}</p>
          <BiomassChart value={value} t={t} />
        </>
      )}
    </details>
  );
}
