import { useState } from "react";

export default function VisionInspection({ image, pastureAnalysis, feedType, t }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [activeZone, setActiveZone] = useState(null);

  if (!image && !pastureAnalysis) {
    return (
      <section className="vision-inspection-card" aria-label={t("visual") || "Visual Analysis"}>
        <div className="vision-header">
          <span className="vision-badge neutral">📷 {t("noImage") || "No Photo Attached"}</span>
        </div>
        <p className="vision-note">
          {t("noImage") || "Assessment is based on entered physical readings and sensory observations."}
        </p>
      </section>
    );
  }

  const hasWarning = !!image?.warning;
  const qualityStatus = hasWarning ? "warning" : "good";

  return (
    <section className="vision-inspection-card" aria-label={t("visual") || "Visual Analysis"}>
      <div className="vision-header">
        <div className="vision-title-group">
          <span className="vision-badge ai-badge">
            <span className="pulse-dot" /> Edge AI Vision Inspector
          </span>
          <h3>{t("visual") || "Optical & Biomass Inspection"}</h3>
        </div>
        <div className="vision-toggles">
          <button
            type="button"
            className={`toggle-btn ${showOverlay ? "active" : ""}`}
            onClick={() => setShowOverlay(!showOverlay)}
            aria-pressed={showOverlay}
          >
            {showOverlay ? "🎯 Hide Grid Overlay" : "🎯 Show Grid Overlay"}
          </button>
        </div>
      </div>

      <div className="vision-content-grid">
        {image?.dataUrl && (
          <div className="vision-viewport-wrapper">
            <div className={`vision-viewport ${showOverlay ? "with-overlay" : ""}`}>
              <img
                src={image.dataUrl}
                alt="Analyzed livestock feed specimen"
                className="vision-specimen-img"
              />
              {showOverlay && (
                <div className="vision-overlay-layer">
                  <div className="reticle-box" />
                  <div className="scan-line" />
                  <div className="detection-tags">
                    <span className="tag-pill category-tag">
                      {feedType === "maize_silage"
                        ? "🌽 Forage Specimen"
                        : feedType === "dry_feed"
                        ? "🌾 Dry Grain/Roughage"
                        : "🌱 Pasture Canopy"}
                    </span>
                    <span className={`tag-pill status-${qualityStatus}`}>
                      {hasWarning ? `⚠ ${t(image.warning)}` : "✓ Clean Optical Frame"}
                    </span>
                  </div>
                  {/* Visual sampling quadrants */}
                  <div className="quadrant-grid">
                    {[1, 2, 3, 4].map((q) => (
                      <div
                        key={q}
                        className={`quadrant-cell ${activeZone === q ? "highlight" : ""}`}
                        onMouseEnter={() => setActiveZone(q)}
                        onMouseLeave={() => setActiveZone(null)}
                      >
                        <span className="q-label">Q{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="vision-meta-bar">
              <span>Resolution: {image.width} × {image.height}px</span>
              <span>Lighting: {hasWarning && image.warning === "lighting" ? "Needs Adjustment" : "Optimal"}</span>
              <span>Sharpness: {hasWarning && image.warning === "blur" ? "Low Detail" : "Sharp"}</span>
            </div>
          </div>
        )}

        <div className="vision-details-panel">
          <div className="vision-metric-group">
            <h4 className="metric-group-title">Detected Optical Parameters</h4>
            <div className="metric-tiles">
              <div className="metric-tile">
                <span className="metric-label">Identified Substrate</span>
                <strong className="metric-value">
                  {t(feedType) || feedType}
                </strong>
                <small className="metric-sub">Confirmed by user selection</small>
              </div>

              <div className="metric-tile">
                <span className="metric-label">Frame Quality</span>
                <strong className={`metric-value text-${qualityStatus}`}>
                  {hasWarning ? t(image.warning) : "High Clarity"}
                </strong>
                <small className="metric-sub">
                  {hasWarning ? "May affect visual feature detail" : "Edge-filtered RGB sampling"}
                </small>
              </div>

              {pastureAnalysis?.predictions && (
                <>
                  <div className="metric-tile">
                    <span className="metric-label">Green Dry Matter</span>
                    <strong className="metric-value text-accent">
                      {pastureAnalysis.predictions.GDM_g?.toFixed(1) ?? "—"} g
                    </strong>
                    <small className="metric-sub">Photosynthetically active</small>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Total Dry Biomass</span>
                    <strong className="metric-value">
                      {pastureAnalysis.predictions.Dry_Total_g?.toFixed(1) ?? "—"} g
                    </strong>
                    <small className="metric-sub">Combined canopy yield</small>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ai-provenance-box">
            <div className="provenance-header">
              <span className="provenance-icon">⚡</span>
              <strong>Client-Side Edge Inference (100% Offline)</strong>
            </div>
            <p className="provenance-desc">
              Images are processed locally in your browser using WebAssembly SIMD. No photos are uploaded to external servers, protecting your farm data sovereignty.
            </p>
            <div className="integrity-callout">
              <strong>🔬 Scientific Rigor:</strong>
              <span>
                {" "}Optical inspection verifies physical morphology, foliage proportion, and visible surface anomalies. Biochemical properties (Aflatoxins, Mycotoxins, NDF, TDN) require laboratory assays or NIR spectroscopy.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
