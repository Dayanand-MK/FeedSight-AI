export default function About({ t }) {
  const rows = [
    [
      "Goal-based intelligence",
      "Five-step offline wizard; general, milk, health, reproductive and profitability profiles. Safety → storage → nutrition → goal → economics. Qualitative rules with no invented requirement thresholds, yield, fertility or savings. Saved goals remain immutable; switching is comparison-only after saving.",
    ],
    [
      "Nutrition",
      "Entered crude protein, NDF fiber, energy and source-labelled moisture. Optional nutritionist-supplied ingredient minimums; no universal animal requirements.",
    ],
    [
      "Safety / adulteration",
      "Farmer-reported mould and foreign material, risk flags and confirmation advice. Urea, sand/silica and toxins are not chemically tested.",
    ],
    [
      "Instant advisory",
      "Local deterministic report with safety → storage → nutrition priority. No exact supplement doses.",
    ],
    [
      "Storage / silage",
      "Manual or simulated readings, pH where applicable, timestamps, batch history and comparable-source trends.",
    ],
    [
      "AI / ML",
      "Existing trained FQI regressor runs offline for ten complete laboratory inputs. FQI is separate from safety and nutrition adequacy.",
    ],
    [
      "Computer vision",
      "Local image resizing and brightness/detail validation. Automatic mould recognition is unavailable without training data.",
    ],
    [
      "IoT",
      "Built-in Virtual Sensor Simulation and normalized source/unit adapter; future real sensor integration.",
    ],
    [
      "NIR",
      "No spectral data or hardware connected. NIR instrument names in the dataset are provenance, not spectra.",
    ],
    [
      "Mobile / low cost / offline",
      "Installable React PWA, IndexedDB, local bundled code and model. No paid service or backend required for basic checks.",
    ],
    [
      "Multilingual voice",
      "English, Tamil and Hindi text; user-triggered device speech using a matching local voice only. Missing voices leave the written report available.",
    ],
    [
      "Cloud monitoring",
      "Optional authenticated Supabase upload/download and dashboard; owner RLS and replay-safe UUID records. Live project configuration is required.",
    ],
    [
      "Traceability",
      "One report snapshot drives UI, speech, Digital Twin, JSON export and QR safety summary. Older reports retain their historical scores.",
    ],
  ];
  return (
    <section className="card">
      <h1>{t("about")}</h1>
      <p>{t("portable")}</p>
      <div className="table-wrap">
        <table className="technical-table">
          <thead>
            <tr>
              <th>SIH requirement</th>
              <th>Implemented scope / limitation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
