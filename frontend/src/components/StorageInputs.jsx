import { limits, presets, simulationPreset } from "../services/assessment.js";
export default function StorageInputs({ input, change, t }) {
  const keys = Object.keys(limits).filter(
    (k) => k !== "ph" || input.feedType === "maize_silage",
  );
  return (
    <>
      <label>
        {t("source")}
        <select
          value={input.source}
          onChange={(e) =>
            change({
              source: e.target.value,
              ...Object.fromEntries(
                Object.keys(limits).map((k) => [
                  k,
                  e.target.value === "virtual" ? presets.low[k] : "",
                ]),
              ),
            })
          }
        >
          <option value="manual">{t("manual")}</option>
          <option value="virtual">{t("virtual")}</option>
        </select>
      </label>
      {input.source === "virtual" && (
        <div className="simulation">
          <strong>{t("virtual")}</strong>
          <p>{t("simulationNote")}</p>
          <div className="button-row">
            {Object.keys(presets).map((k) => (
              <button
                type="button"
                key={k}
                className="quiet"
                onClick={() => change(simulationPreset(input, k))}
              >
                {t(k)}
              </button>
            ))}
          </div>
        </div>
      )}
      <p>{t("optionalHint")}</p>
      <div className="two-cols">
        {keys.map((key) => (
          <div key={key}>
            <label>
              {t(key)}
              <small>
                {" "}
                {limits[key][0]}–{limits[key][1]}
              </small>
              <input
                aria-label={t(key)}
                type="number"
                step={key === "storageAge" ? 1 : "any"}
                min={limits[key][0]}
                max={limits[key][1]}
                value={input[key] ?? ""}
                placeholder={t("dontKnow")}
                onChange={(e) => change({ [key]: e.target.value })}
              />
            </label>
            {input.source === "virtual" && input[key] !== "" && (
              <input
                aria-label={`${t(key)} slider`}
                type="range"
                min={limits[key][0]}
                max={limits[key][1]}
                step={key === "ph" ? 0.1 : 1}
                value={input[key] ?? 0}
                onChange={(e) => change({ [key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <details>
        <summary>{t("whatMoisture")}</summary>
        <p>{t("moistureHelp")}</p>
      </details>
    </>
  );
}
