import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReport,
  asReport,
  passportSummary,
  storageTrend,
} from "../src/services/report.js";
import {
  assess,
  presets,
  simulationPreset,
} from "../src/services/assessment.js";
import { localVoice, spokenReport } from "../src/services/speech.js";
import { translate } from "../src/locales/index.js";
const input = (patch = {}) => ({
  feedType: "maize_silage",
  source: "manual",
  ...presets.low,
  foreignMaterial: false,
  ...patch,
});
const t = (key) => translate("en", key);
test("simulation presets preserve manual hazards and use dry-feed moisture examples", () => {
  const observed = input({ mould: true, observationSource: "manual" });
  const patch = simulationPreset(observed, "low");
  assert.equal(patch.mould, true);
  assert.equal(buildReport({ ...observed, ...patch }).risk, "high");
  const dry = input({ feedType: "dry_feed", observationSource: "virtual" });
  assert.equal(simulationPreset(dry, "low").moisture, 12);
});
test("missing values produce unavailable score without invented nutrition or toxin readings", () => {
  const r = buildReport(
    input({
      temperature: "",
      humidity: "",
      moisture: "",
      ph: "",
      mould: null,
      smell: null,
    }),
  );
  assert.equal(r.score, null);
  assert.equal(r.overall.status, "unknown");
  assert.equal(r.nutrition.values.protein.value, null);
  assert.equal(r.nutrition.values.moisture.value, null);
  assert.equal(
    r.safety.items.find((v) => v.key === "urea").status,
    "notTested",
  );
  assert.equal(
    r.safety.items.find((v) => v.key === "toxins").status,
    "labConfirmation",
  );
  assert.equal(r.silage.ph, null);
  assert.equal(r.storage.flags.length, 0);
  assert.ok(r.feedSuggestions.blocked);
});
test("measured nutrients are not silently interpreted as universal animal requirements", () => {
  const r = buildReport(
    input({
      animalType: "lactating",
      nutrients: { protein: 8.7, fiber: 28, energy: 10 },
    }),
  );
  assert.equal(r.nutrition.values.protein.value, 8.7);
  assert.equal(r.nutrition.values.protein.source, "entered");
  assert.equal(r.nutrition.values.protein.status, "insufficient");
  assert.equal(r.nutrition.values.energy.value, 10);
  assert.equal(r.nutrition.values.energy.status, "insufficient");
  assert.ok(!r.feedSuggestions.items.includes("proteinSuggestion"));
});
test("explicit documented ingredient targets produce a gap and conditional suggestions", () => {
  const r = buildReport(
    input({
      nutrients: { protein: 8, fiber: 30 },
      targets: {
        enabled: true,
        reference: "Test nutritionist ingredient benchmark",
        protein: 12,
        fiber: 25,
      },
    }),
  );
  assert.equal(r.nutrition.values.protein.gap, 4);
  assert.equal(r.nutrition.values.fiber.status, "meetsMinimum");
  assert.ok(r.feedSuggestions.items.includes("proteinSuggestion"));
  assert.equal(r.nutrition.completeRation, false);
  assert.throws(
    () => buildReport(input({ targets: { enabled: true, protein: 12 } })),
    /targetReferenceNeeded/,
  );
});
test("mould and foreign material override nutritional optimization including spoken report", () => {
  for (const hazard of [{ mould: true }, { foreignMaterial: true }]) {
    const r = buildReport(
      input({
        ...hazard,
        nutrients: { protein: 4 },
        targets: { enabled: true, reference: "Test benchmark", protein: 15 },
      }),
    );
    assert.equal(r.overall.status, "high");
    assert.equal(r.feedSuggestions.reason, "safety");
    assert.deepEqual(r.feedSuggestions.items, ["nutritionBlocked"]);
    assert.ok(r.recommendations.immediate.includes("noMix"));
    assert.ok(!spokenReport(r, t).includes(t("proteinSuggestion")));
    assert.equal(r.safety.status, "high");
  }
});
test("wet feed prioritizes storage ahead of supplements", () => {
  const r = buildReport(
    input({
      moisture: 76,
      nutrients: { protein: 4 },
      targets: { enabled: true, reference: "Test benchmark", protein: 15 },
    }),
  );
  assert.equal(r.feedSuggestions.reason, "storage");
  assert.deepEqual(r.feedSuggestions.items, ["storageFirst"]);
});
test("unknown pH is valid but out-of-range readings and nutrients are rejected", () => {
  assert.equal(buildReport(input({ ph: "" })).score, null);
  for (const patch of [
    { ph: 15 },
    { humidity: 101 },
    { nutrients: { protein: 101 } },
    { nutrients: { energy: -1 } },
    { foreignMaterial: "yes" },
  ])
    assert.throws(() => buildReport(input(patch)));
  assert.equal(
    buildReport(input({ feedType: "dry_feed", moisture: 12, ph: "" })).silage,
    null,
  );
});
test("one snapshot supplies passport and legacy projection preserves original score", () => {
  const legacy = assess(input());
  const projected = asReport(
    legacy,
    input(),
    "2026-09-10T00:00:00Z",
    "batch-a",
  );
  assert.equal(projected.score, legacy.score);
  assert.ok(projected.legacy);
  const summary = passportSummary(
    { id: "batch-a", feedType: "maize_silage" },
    { result: projected, input: input(), createdAt: projected.timestamp },
  );
  assert.equal(summary.score, projected.overall.score);
  assert.equal(summary.safety, projected.safety.status);
  assert.equal(summary.tested, projected.timestamp);
});
test("storage trends compare recorded values and do not mix sources", () => {
  const a = {
    createdAt: "2026-09-09",
    result: buildReport(input({ humidity: 65 })),
    input: input(),
  };
  const b = {
    createdAt: "2026-09-10",
    result: buildReport(input({ humidity: 85 })),
    input: input(),
  };
  assert.deepEqual(storageTrend([a, b]), ["humidity"]);
  b.result = buildReport(input({ source: "virtual", humidity: 85 }));
  assert.deepEqual(storageTrend([a, b]), []);
});
test("local speech requires a matching installed voice and keeps language summaries consistent", () => {
  const voices = [
    { lang: "en-US", localService: true },
    { lang: "ta-IN", localService: false },
    { lang: "hi-IN", localService: true },
  ];
  assert.equal(localVoice(voices, "ta"), null);
  assert.equal(localVoice(voices, "hi"), voices[2]);
  assert.equal(localVoice([], "en"), null);
  for (const lang of ["en", "ta", "hi"]) {
    const text = spokenReport(buildReport(input()), (k) => translate(lang, k));
    assert.ok(text.includes(translate(lang, "spokenIntro")));
    assert.ok(!text.includes("undefined"));
  }
});
