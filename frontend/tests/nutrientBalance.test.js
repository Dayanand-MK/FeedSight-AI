import test from "node:test";
import assert from "node:assert/strict";
import { buildReport } from "../src/services/report.js";
import { withGoal } from "../src/services/goals.js";
import { compareNutrient } from "../src/services/nutrientBalance.js";
import { spokenReport } from "../src/services/speech.js";
import { translate } from "../src/locales/index.js";
const input = (patch = {}) => ({
  feedType: "dry_feed",
  source: "manual",
  temperature: 28,
  humidity: 50,
  moisture: 12,
  mould: false,
  smell: false,
  foreignMaterial: false,
  animalType: "lactating",
  goal: "milk",
  nutrients: { protein: 8, fiber: 20 },
  targets: {
    enabled: true,
    reference: "User supplied test benchmark, not animal requirement",
    protein: 12,
    fiber: 30,
  },
  ...patch,
});
test("supported documented ingredient gaps produce ranked conditional categories", () => {
  const b = buildReport(input()).nutrientBalance;
  assert.equal(b.blocked, false);
  assert.equal(b.rows.find((r) => r.key === "protein").gap, 4);
  assert.ok(b.options.some((o) => o.id === "protein_feed"));
  assert.ok(b.options.some((o) => o.id === "roughage"));
  assert.equal(b.animalRequirementsAvailable, false);
  assert.equal(
    b.rows.find((r) => r.key === "protein").provenance,
    "FARMER_INPUT",
  );
});
test("adequate minimums never produce unnecessary supplements", () => {
  const b = buildReport(
    input({ nutrients: { protein: 15, fiber: 35 } }),
  ).nutrientBalance;
  assert.deepEqual(b.options, []);
  assert.equal(b.rows.find((r) => r.key === "protein").status, "balanceMeets");
});
test("unsupported minerals and unknown targets remain unknown", () => {
  const b = buildReport(
    input({ targets: { enabled: false }, nutrients: { minerals: 1 } }),
  ).nutrientBalance;
  assert.deepEqual(b.options, []);
  assert.ok(b.rows.every((r) => r.status === "balanceUnknown"));
  assert.ok(b.unsupported.includes("minerals"));
});
test("incompatible units block numeric comparisons and old gap advice", () => {
  const r = buildReport(
    input({
      nutrientUnits: { protein: "% as fed" },
      nutrients: { protein: 8, fiber: 40 },
    }),
  );
  assert.equal(
    r.nutrientBalance.rows.find((r) => r.key === "protein").status,
    "balanceUnavailable",
  );
  assert.equal(r.nutrition.values.protein.gap, null);
  assert.deepEqual(r.nutrientBalance.options, []);
  assert.equal(
    compareNutrient(
      { value: 2, target: 3, reference: "test", unit: "g/day" },
      "% DM",
    ).gap,
    null,
  );
});
test("safety and storage block all balancing options in every requested language", () => {
  for (const patch of [
    { mould: true },
    { foreignMaterial: true },
    { moisture: 30 },
  ]) {
    const r = buildReport(input(patch));
    assert.equal(r.nutrientBalance.blocked, true);
    assert.deepEqual(r.nutrientBalance.options, []);
    for (const lang of ["en", "ta", "hi"]) {
      const text = spokenReport(r, (k) => translate(lang, k));
      assert.ok(!text.includes(translate(lang, "balanceProteinOption")));
    }
  }
});
test("goal switch recalculates priorities without rerunning image or mutating saved snapshot", () => {
  const original = buildReport(input());
  const before = JSON.stringify(original);
  const changed = withGoal(original, "health");
  assert.equal(changed.nutrientBalance.rows[0].key, "fiber");
  assert.equal(changed.nutrientBalance.options[0].id, "roughage");
  assert.equal(changed.image, original.image);
  assert.equal(changed.timestamp, original.timestamp);
  assert.equal(JSON.stringify(original), before);
});
test("fresh pasture unknown checks and calf/unknown context do not unlock adult options", () => {
  for (const patch of [
    { feedType: "green_fodder" },
    { animalType: "calf" },
    { animalType: "unspecified" },
  ]) {
    assert.deepEqual(buildReport(input(patch)).nutrientBalance.options, []);
  }
});
