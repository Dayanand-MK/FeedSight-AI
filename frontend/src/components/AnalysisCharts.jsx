import { useState } from "react";
import { biomassParts, trendMetrics, trendRows } from "../services/charts.js";

export function BiomassChart({ value, t }) {
  const [percent, setPercent] = useState(false),
    [selected, setSelected] = useState("Dry_Green_g");
  const parts = biomassParts(value?.predictions);
  if (!parts.length) return null;
  const active = parts.find((row) => row.key === selected) || parts[0];
  const maximum = Math.max(...parts.map((row) => row.value), 1);
  return (
    <section className="analysis-chart" aria-label={t("biomassExplore")}>
      <h3>{t("biomassExplore")}</h3>
      <p>{t("biomassNotClasses")}</p>
      <div className="chart-controls">
        <button
          type="button"
          aria-pressed={!percent}
          onClick={() => setPercent(false)}
        >
          {t("gramsView")}
        </button>
        <button
          type="button"
          aria-pressed={percent}
          onClick={() => setPercent(true)}
        >
          {t("shareView")}
        </button>
      </div>
      <div className="component-bars">
        {parts.map((row, i) => (
          <button
            type="button"
            key={row.key}
            className={`component-row component-${i}`}
            aria-pressed={selected === row.key}
            onClick={() => setSelected(row.key)}
          >
            <span>{t(row.key)}</span>
            <strong>
              {percent
                ? row.percent == null
                  ? "—"
                  : `${row.percent.toFixed(1)}%`
                : `${row.value.toFixed(1)} g`}
            </strong>
            <span className="bar-track" aria-hidden="true">
              <span
                style={{
                  width: `${percent ? row.percent || 0 : (row.value / maximum) * 100}%`,
                }}
              />
            </span>
          </button>
        ))}
      </div>
      <p role="status" className="notice">
        <strong>{t(active.key)}: </strong>
        {t(`${active.key}Explain`)}
      </p>
      <p className="chart-note">{t("shareExplanation")}</p>
      <details>
        <summary>{t("showTotals")}</summary>
        <p>
          {t("GDM_g")}: {(parts[0].value + parts[2].value).toFixed(1)} g
        </p>
        <p>
          {t("Dry_Total_g")}:{" "}
          {parts.reduce((s, r) => s + r.value, 0).toFixed(1)} g
        </p>
        <p>{t("totalsExplanation")}</p>
      </details>
    </section>
  );
}

export function NutritionChart({ nutrition, t }) {
  const [key, setKey] = useState("protein");
  const row = nutrition.values[key];
  const known = typeof row.value === "number" && Number.isFinite(row.value);
  const target =
    typeof row.target === "number" &&
    Number.isFinite(row.target) &&
    (row.targetUnit || row.unit) === row.unit &&
    row.status !== "balanceUnavailable";
  const scale = Math.max(row.value || 0, row.target || 0, 1);
  return (
    <section className="analysis-chart" aria-label={t("nutritionExplore")}>
      <h3>{t("nutritionExplore")}</h3>
      <div className="chart-controls">
        {["protein", "fiber", "energy"].map((k) => (
          <button
            type="button"
            key={k}
            aria-pressed={key === k}
            onClick={() => setKey(k)}
          >
            {t(k)}
          </button>
        ))}
      </div>
      <p>{t("nutritionScope")}</p>
      {[
        { name: "enteredValue", value: row.value, available: known },
        { name: "targetReference", value: row.target, available: target },
      ].map((r, i) => (
        <div className={`comparison-row component-${i}`} key={r.name}>
          <span>{t(r.name)}</span>
          <strong>
            {r.available ? `${r.value} ${row.unit}` : t("notAvailable")}
          </strong>
          <span className="bar-track" aria-hidden="true">
            {r.available && (
              <span style={{ width: `${(r.value / scale) * 100}%` }} />
            )}
          </span>
        </div>
      ))}
      <p role="status">
        {t(row.status)}
        {row.gap != null && (
          <>
            {" "}
            · {row.gap.toFixed(1)} {t("gapPoints")}
          </>
        )}
      </p>
      <p className="chart-note">
        {t(row.source)}
        {row.reference && <> · {row.reference}</>}
      </p>
    </section>
  );
}

export function HistoryChart({ tests, t }) {
  const [metric, setMetric] = useState("moisture"),
    [source, setSource] = useState("manual"),
    [index, setIndex] = useState(0);
  const sources = [
    ...new Set(tests.map((r) => r.result?.storage?.source).filter(Boolean)),
  ];
  const activeSource = sources.includes(source) ? source : sources[0];
  const rows = trendRows(tests, metric, activeSource),
    values = rows.filter((r) => r.value != null);
  const selected = rows[Math.min(index, rows.length - 1)];
  const min = Math.min(...values.map((r) => r.value), 0),
    max = Math.max(...values.map((r) => r.value), min + 1);
  const first = rows[0]?.time || 0,
    span = (rows.at(-1)?.time || 0) - first;
  const x = (row) => (span ? 35 + ((row.time - first) / span) * 510 : 290);
  const y = (row) => 175 - ((row.value - min) / (max - min)) * 140;
  let segments = [],
    segment = [];
  for (const row of rows) {
    if (row.value == null) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(row);
  }
  if (segment.length) segments.push(segment);
  return (
    <section className="analysis-chart" aria-label={t("trendExplore")}>
      <h2>{t("trendExplore")}</h2>
      <div className="chart-controls">
        <label>
          {t("chartMetric")}
          <select
            value={metric}
            onChange={(e) => {
              setMetric(e.target.value);
              setIndex(0);
            }}
          >
            {Object.keys(trendMetrics).map((k) => (
              <option value={k} key={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("source")}
          <select
            value={activeSource || ""}
            onChange={(e) => {
              setSource(e.target.value);
              setIndex(0);
            }}
          >
            {sources.map((k) => (
              <option value={k} key={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={activeSource === "virtual" ? "notice" : "chart-note"}>
        {t(activeSource || "notAvailable")} · {t("realHistoryOnly")}
      </p>
      {values.length ? (
        <>
          <svg
            className="trend-svg"
            viewBox="0 0 580 210"
            role="img"
            aria-label={`${t(metric)} (${trendMetrics[metric]})`}
          >
            <line
              x1="35"
              y1="175"
              x2="545"
              y2="175"
              stroke="currentColor"
              opacity=".3"
            />
            <text x="4" y="30">
              {max.toFixed(1)}
            </text>
            <text x="4" y="179">
              {min}
            </text>
            {segments.map((s, i) => (
              <polyline
                key={i}
                points={s.map((r) => `${x(r)},${y(r)}`).join(" ")}
                fill="none"
                stroke="#286849"
                strokeWidth="3"
              />
            ))}
            {rows.map((row, i) =>
              row.value == null ? null : (
                <circle
                  key={row.id}
                  cx={x(row)}
                  cy={y(row)}
                  r={i === index ? 7 : 4}
                  fill={i === index ? "#9a4d20" : "#286849"}
                >
                  <title>
                    {new Date(row.time).toLocaleString()}: {row.value}{" "}
                    {trendMetrics[metric]}
                  </title>
                </circle>
              ),
            )}
            <text x="35" y="202">
              {new Date(first).toLocaleDateString()}
            </text>
            <text x="545" y="202" textAnchor="end">
              {new Date(rows.at(-1).time).toLocaleDateString()}
            </text>
          </svg>
          <label>
            {t("inspectReading")}
            <input
              type="range"
              min="0"
              max={Math.max(0, rows.length - 1)}
              value={Math.min(index, rows.length - 1)}
              onChange={(e) => setIndex(Number(e.target.value))}
            />
          </label>
          <p role="status">
            {selected && (
              <>
                {new Date(selected.time).toLocaleString()} ·{" "}
                {selected.value == null
                  ? t("notAvailable")
                  : `${selected.value} ${trendMetrics[metric]}`}
              </>
            )}
          </p>
        </>
      ) : (
        <p>{t("chartEmpty")}</p>
      )}
      <p className="chart-note">{t("noForecast")}</p>
    </section>
  );
}

export function FqiGauge({ score, status = "unknown", t }) {
  const valid = typeof score === "number" && Number.isFinite(score);
  const displayScore = valid ? Math.round(score) : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = valid
    ? circumference -
      (circumference * 0.75 * Math.min(100, Math.max(0, displayScore))) / 100
    : circumference;

  const colorMap = {
    low: "#2e7d32",
    moderate: "#e65100",
    high: "#c62828",
    unknown: "#757575",
  };
  const color = colorMap[status] || "#2e7d32";

  return (
    <div className="fqi-gauge-container">
      <svg
        className="fqi-gauge-svg"
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Feed Health Score: ${valid ? displayScore : "Unavailable"}`}
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e0e8dc"
          strokeWidth="11"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={0}
          transform="rotate(135 80 80)"
          strokeLinecap="round"
        />
        {valid && (
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(135 80 80)"
            strokeLinecap="round"
            className="fqi-gauge-arc"
          />
        )}
        <text
          x="80"
          y="74"
          textAnchor="middle"
          className="fqi-gauge-val"
          fill={valid ? color : "#888"}
        >
          {valid ? displayScore : "—"}
        </text>
        <text x="80" y="96" textAnchor="middle" className="fqi-gauge-denom">
          / 100
        </text>
        <text
          x="80"
          y="122"
          textAnchor="middle"
          className="fqi-gauge-sublabel"
          fill={color}
        >
          {t(status) || status.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

export function NutrientRadarChart({ nutrition, t }) {
  const metrics = [
    { key: "protein", label: "Protein (CP)", max: 25 },
    { key: "energy", label: "Energy (TDN)", max: 80 },
    { key: "fiber", label: "Fiber (NDF)", max: 60 },
    { key: "minerals", label: "Minerals", max: 12 },
    {
      key: "moisture",
      label: "Dry Matter",
      max: 100,
      transform: (v) => (v != null ? 100 - v : null),
    },
  ];
  const center = 120,
    r = 70;
  const points = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    const rawVal = nutrition?.values?.[m.key]?.value;
    const val = m.transform ? m.transform(rawVal) : rawVal;
    const norm =
      typeof val === "number" && Number.isFinite(val)
        ? Math.min(1, Math.max(0.12, val / m.max))
        : 0.25;
    const x = center + r * norm * Math.cos(angle);
    const y = center + r * norm * Math.sin(angle);
    const labelX = center + (r + 26) * Math.cos(angle);
    const labelY = center + (r + 22) * Math.sin(angle);
    return { ...m, x, y, labelX, labelY, val, angle };
  });

  const polygonStr = points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <section
      className="analysis-chart radar-chart"
      aria-label="Nutrient Balance Profile"
    >
      <h3>🧬 {t("nutritionQuality") || "Nutrient Balance Profile"}</h3>
      <p className="chart-note">
        Multi-nutrient distribution compared with dairy dietary targets.
      </p>
      <div className="radar-svg-wrap">
        <svg viewBox="0 0 240 240" className="radar-svg" role="img">
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <circle
              key={scale}
              cx={center}
              cy={center}
              r={r * scale}
              fill="none"
              stroke="#d4ded0"
              strokeDasharray={scale === 1 ? "none" : "3,3"}
            />
          ))}
          {points.map((p, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + r * Math.cos(p.angle)}
              y2={center + r * Math.sin(p.angle)}
              stroke="#d4ded0"
            />
          ))}
          <polygon
            points={polygonStr}
            fill="rgba(46, 125, 50, 0.22)"
            stroke="#2e7d32"
            strokeWidth="2.5"
            className="radar-polygon"
          />
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#2e7d32"
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="radar-label"
                fontSize="9"
              >
                {t(p.key) || p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

export function StorageRiskMatrix({ storage, silage, t }) {
  const temp = storage?.readings?.temperature;
  const moist = storage?.readings?.moisture;
  const hasReadings = typeof temp === "number" && typeof moist === "number";

  const x = (m) => 40 + ((m - 10) / 80) * 240;
  const y = (tVal) => 150 - ((tVal - 10) / 40) * 120;

  const currentX = hasReadings ? Math.min(280, Math.max(40, x(moist))) : null;
  const currentY = hasReadings ? Math.min(150, Math.max(30, y(temp))) : null;

  return (
    <section
      className="analysis-chart risk-matrix-chart"
      aria-label="Storage Stability Matrix"
    >
      <h3>🌡 {t("storageMonitor") || "Storage Stability Envelope"}</h3>
      <p className="chart-note">
        Real-time psychrometric risk envelope: moisture and temperature
        interaction governing spoilage.
      </p>
      <div className="matrix-svg-wrap">
        <svg viewBox="0 0 320 190" className="matrix-svg" role="img">
          <rect
            x="40"
            y="55"
            width="95"
            height="95"
            fill="rgba(76, 175, 80, 0.16)"
            rx="4"
          />
          <text
            x="87"
            y="105"
            textAnchor="middle"
            fontSize="11"
            fill="#2e7d32"
            fontWeight="600"
          >
            Safe Zone
          </text>

          <rect
            x="135"
            y="40"
            width="80"
            height="110"
            fill="rgba(255, 152, 0, 0.16)"
            rx="4"
          />
          <text
            x="175"
            y="95"
            textAnchor="middle"
            fontSize="10"
            fill="#e65100"
            fontWeight="600"
          >
            Caution
          </text>

          <rect
            x="215"
            y="25"
            width="70"
            height="125"
            fill="rgba(244, 67, 54, 0.16)"
            rx="4"
          />
          <text
            x="250"
            y="85"
            textAnchor="middle"
            fontSize="10"
            fill="#c62828"
            fontWeight="600"
          >
            High Risk
          </text>

          <line
            x1="40"
            y1="150"
            x2="285"
            y2="150"
            stroke="#888"
            strokeWidth="1.5"
          />
          <line
            x1="40"
            y1="25"
            x2="40"
            y2="150"
            stroke="#888"
            strokeWidth="1.5"
          />

          <text x="162" y="172" textAnchor="middle" fontSize="10" fill="#555">
            Moisture % (10% → 90%)
          </text>
          <text
            x="16"
            y="90"
            textAnchor="middle"
            fontSize="10"
            fill="#555"
            transform="rotate(-90 16 90)"
          >
            Temp °C (10 → 50°C)
          </text>

          {hasReadings && (
            <g className="matrix-current-point">
              <circle
                cx={currentX}
                cy={currentY}
                r="6"
                fill="#1565c0"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="11"
                fill="none"
                stroke="#1565c0"
                opacity="0.4"
                className="pulse-circle"
              />
              <text
                x={currentX}
                y={currentY - 11}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1565c0"
              >
                Current ({moist}%, {temp}°C)
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
