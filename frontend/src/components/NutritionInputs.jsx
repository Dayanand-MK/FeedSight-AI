import { animalFields } from "../config/goalProfiles.js";
import {
  nutritionProfiles,
  nutrientFields,
} from "../config/nutritionProfiles.js";
export default function NutritionInputs({ input, change, t }) {
  const nutrients = input.nutrients || {},
    targets = input.targets || {};
  return (
    <>
      <label>
        {t("animalType")}
        <select
          value={input.animalType || "unspecified"}
          onChange={(e) => change({ animalType: e.target.value })}
        >
          {Object.keys(nutritionProfiles).map((k) => (
            <option value={k} key={k}>
              {t(k)}
            </option>
          ))}
        </select>
      </label>
      <details>
        <summary>{t("animalExtra")}</summary>
        <p>{t("optionalHint")}</p>
        {Object.entries(animalFields)
          .filter(
            ([key]) => key !== "milkYield" || input.animalType === "lactating",
          )
          .map(([key, [min, max]]) => (
            <label key={key}>
              {t(key)}
              <input
                type="number"
                step="any"
                min={min}
                max={max}
                placeholder={t("dontKnow")}
                value={input.animalContext?.[key] ?? ""}
                onChange={(e) =>
                  change({
                    animalContext: {
                      ...input.animalContext,
                      [key]: e.target.value,
                    },
                  })
                }
              />
            </label>
          ))}
        {[
          ["lactationStage", ["early", "middle", "late"]],
          ["reproductiveStatus", ["pregnant", "notPregnant"]],
        ]
          .filter(
            ([key]) =>
              key !== "lactationStage" || input.animalType === "lactating",
          )
          .map(([key, options]) => (
            <label key={key}>
              {t(key)}
              <select
                value={input.animalContext?.[key] || "unknown"}
                onChange={(e) =>
                  change({
                    animalContext: {
                      ...input.animalContext,
                      [key]: e.target.value,
                    },
                  })
                }
              >
                <option value="unknown">{t("dontKnow")}</option>
                {options.map((value) => (
                  <option key={value} value={value}>
                    {t(`stage${value[0].toUpperCase()}${value.slice(1)}`)}
                  </option>
                ))}
              </select>
            </label>
          ))}
      </details>
      <details className="nutrition-inputs">
        <summary>{t("nutrientMeasurements")}</summary>
        <p>{t("nutrientHelp")}</p>
        <div className="two-cols">
          {Object.entries(nutrientFields).map(([key, c]) => (
            <label key={key}>
              {t(key)} ({c.unit})
              <input
                aria-label={t(key)}
                type="number"
                step="any"
                min={c.min}
                max={c.max}
                placeholder={t("dontKnow")}
                value={nutrients[key] ?? ""}
                onChange={(e) =>
                  change({ nutrients: { ...nutrients, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={!!targets.enabled}
            onChange={(e) =>
              change({ targets: { ...targets, enabled: e.target.checked } })
            }
          />
          {t("useTargets")}
        </label>
        {targets.enabled && (
          <>
            <p>{t("nutritionScope")}</p>
            <label>
              {t("targetReference")}
              <input
                maxLength="160"
                value={targets.reference || ""}
                onChange={(e) =>
                  change({ targets: { ...targets, reference: e.target.value } })
                }
              />
            </label>
            <div className="two-cols">
              {["protein", "fiber"].map((key) => (
                <label key={key}>
                  {t(`${key}Target`)}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={targets[key] ?? ""}
                    placeholder={t("dontKnow")}
                    onChange={(e) =>
                      change({ targets: { ...targets, [key]: e.target.value } })
                    }
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </details>
    </>
  );
}
