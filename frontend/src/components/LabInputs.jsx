import { useState } from "react";
import { predictLocal } from "../services/fqiLocal.js";
const fields = {
  pH: "pH",
  "ammonia.s": "Ammonia (% total N)",
  "lactic.ac.s": "Lactic acid (% DM)",
  "acetic.ac.s": "Acetic acid (% DM)",
  "propionic.ac.s": "Propionic acid (% DM)",
  "butyric.ac.s": "Butyric acid (% DM)",
  "ethanol.s": "Ethanol (% DM)",
  "mannithol.s": "Mannitol (% DM)",
  "dm.s": "Dry matter (%)",
  "starch.s": "Starch (% DM)",
};
export default function LabInputs({ t, onEstimate, initialValue }) {
  const [lab, setLab] = useState(initialValue?.values || {}),
    [value, setValue] = useState(initialValue || null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function estimate() {
    setBusy(true);
    setError("");
    try {
      const result = {
        ...(await predictLocal(lab)),
        values: { ...lab },
        source: "manual",
      };
      setValue(result);
      onEstimate(result);
    } catch (e) {
      setValue(null);
      onEstimate(null);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="lab-panel">
      <summary>{t("lab")}</summary>
      <p>{t("labNote")}</p>
      <div className="two-cols">
        {Object.entries(fields).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              step="any"
              min="0"
              value={lab[key] ?? ""}
              onChange={(e) => {
                setLab({ ...lab, [key]: e.target.value });
                setValue(null);
                onEstimate(null);
              }}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="quiet"
        disabled={busy}
        onClick={estimate}
      >
        {t("estimate")}
      </button>
      {error && <p role="alert">{t(error)}</p>}
      {value && (
        <p>
          {t("labResult")}: {value.value.toFixed(2)}
        </p>
      )}
    </details>
  );
}
