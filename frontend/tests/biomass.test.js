import test from "node:test";
import assert from "node:assert/strict";
import { biomassPixels } from "../src/services/biomass.js";
import { buildReport } from "../src/services/report.js";
test("biomass sampling preserves both views and ImageNet normalization", () => {
  const pixels = new Uint8ClampedArray([
    255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255,
  ]);
  const out = biomassPixels(pixels, 4, 1);
  assert.equal(out.length, 3 * 224 * 448);
  assert.ok(Math.abs(out[0] - (1 - 0.485) / 0.229) < 1e-5);
  assert.ok(Math.abs(out[2 * 224 * 448 + 447] - (1 - 0.406) / 0.225) < 1e-5);
});
test("pasture estimates cannot fill nutrients or override safety", () => {
  const r = buildReport({
    feedType: "dry_feed",
    source: "manual",
    mould: true,
    feedTypeConfirmed: "dry_feed",
    pastureAnalysis: {
      task: "biomass_regression",
      predictions: { Dry_Total_g: 100 },
    },
  });
  assert.equal(r.nutrition.values.protein.value, null);
  assert.equal(r.nutrition.composition.sourceType, "UNKNOWN");
  assert.equal(r.feedSuggestions.blocked, true);
  assert.equal(r.feedIdentification.confirmed, true);
});
test("fresh pasture never inherits dry-feed moisture thresholds or a fabricated score", () => {
  const r = buildReport({
    feedType: "green_fodder",
    source: "manual",
    temperature: 28,
    humidity: 50,
    moisture: 75,
    mould: false,
    smell: false,
    foreignMaterial: false,
  });
  assert.equal(r.overall.score, null);
  assert.equal(r.storage.risk, "unknown");
  assert.equal(r.nutrition.values.moisture.status, "insufficient");
  assert.equal(r.nutrition.values.protein.value, null);
  assert.equal(r.safety.status, "unknown");
});
