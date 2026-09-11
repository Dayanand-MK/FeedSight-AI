import { goalProfiles } from "../config/goalProfiles.js";
export default function GoalPicker({ value = "general", onChange, t }) {
  return (
    <div className="goal-options" role="group" aria-label={t("chooseGoal")}>
      {Object.entries(goalProfiles).map(([key, p]) => (
        <button
          type="button"
          key={key}
          aria-pressed={value === key}
          className={value === key ? "selected" : ""}
          onClick={() => onChange(key)}
        >
          <span aria-hidden="true">{p.icon}</span>
          {t(p.label)}
        </button>
      ))}
    </div>
  );
}
