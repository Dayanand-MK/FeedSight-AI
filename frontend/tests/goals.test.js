import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import {
  buildReport,
  passportSummary,
  asReport,
} from "../src/services/report.js";
import { goalProfiles } from "../src/config/goalProfiles.js";
import { withGoal, animalContext, goalHistory } from "../src/services/goals.js";
import { presets } from "../src/services/assessment.js";
import { spokenReport } from "../src/services/speech.js";
import { translate } from "../src/locales/index.js";
import { db, saveTest, readHistory } from "../src/db/index.js";
const input = (patch = {}) => ({
  feedType: "maize_silage",
  source: "manual",
  ...presets.low,
  foreignMaterial: false,
  animalType: "lactating",
  ...patch,
});

test("all goals are deterministic and do not invent requirements or scores", () => {
  const report = buildReport(input());
  for (const selected of Object.keys(goalProfiles)) {
    const a = withGoal(report, selected),
      b = withGoal(report, selected);
    assert.deepEqual(a, b);
    assert.equal(a.goal.score, null);
    assert.equal(a.goal.status, "goalUnknown");
    assert.equal(a.goal.economics.savings, null);
    assert.strictEqual(a.fqi, report.fqi);
    assert.strictEqual(a.nutrition, report.nutrition);
    assert.strictEqual(a.sensor, report.sensor);
    assert.equal(a.timestamp, report.timestamp);
  }
  assert.equal(report.goal.selected, "general");
  assert.throws(() => withGoal(report, "constructor"), /invalidInput/);
});
test("safety overrides every goal and suppresses supplementation in every spoken language", () => {
  const report = buildReport(
    input({
      mould: true,
      nutrients: { protein: 4 },
      targets: {
        enabled: true,
        protein: 12,
        reference: "Synthetic test benchmark",
      },
    }),
  );
  for (const selected of Object.keys(goalProfiles)) {
    const r = withGoal(report, selected);
    assert.equal(r.goal.priority, "safety");
    assert.equal(r.goal.status, "goalBlocked");
    assert.ok(!r.goal.recommendations.includes("proteinSuggestion"));
    for (const lang of ["en", "ta", "hi"]) {
      const t = (k) => translate(lang, k),
        spoken = spokenReport(r, t);
      assert.ok(spoken.includes(t(goalProfiles[selected].label)));
      assert.ok(spoken.includes(t("goalSafetyStop")));
      assert.ok(!spoken.includes(t("proteinSuggestion")));
    }
  }
});
test("storage wins over nutrition and profitability, gaps use only supplied benchmarks", () => {
  const data = input({
    goal: "profit",
    nutrients: { protein: 4 },
    targets: {
      enabled: true,
      protein: 12,
      reference: "Synthetic test benchmark",
    },
  });
  const safe = buildReport(data);
  assert.equal(safe.goal.priority, "nutrition");
  assert.ok(safe.goal.recommendations.includes("proteinSuggestion"));
  const wet = buildReport({ ...data, humidity: 90 });
  assert.equal(wet.goal.priority, "storage");
  assert.ok(!wet.goal.recommendations.includes("proteinSuggestion"));
  assert.ok(wet.goal.recommendations.includes("goalWaste"));
  assert.equal(wet.goal.economics.savings, null);
});
test("unknown and incompatible animal contexts remain general, invalid values rejected", () => {
  assert.equal(
    buildReport(input({ animalType: "unspecified", goal: "milk" })).goal.status,
    "goalUnknown",
  );
  assert.equal(
    buildReport(input({ animalType: "calf", goal: "milk" })).goal.explanation,
    "goalAnimalMismatch",
  );
  assert.throws(
    () => animalContext(input({ animalContext: { bodyWeight: -1 } })),
    /invalidInput/,
  );
  assert.throws(
    () => animalContext(input({ animalContext: { milkYield: true } })),
    /invalidInput/,
  );
  assert.throws(
    () =>
      animalContext(
        input({ animalContext: { reproductiveStatus: "invented" } }),
      ),
    /invalidInput/,
  );
  assert.equal(
    animalContext(
      input({ animalType: "calf", animalContext: { milkYield: 12 } }),
    ).milkYield,
    null,
  );
});
test("local snapshots, QR and history retain recorded goals; comparison cannot rewrite them", async () => {
  await db.tests.clear();
  await db.batches.clear();
  const data = input({
    goal: "reproduction",
    batchName: "Goal test",
    animalContext: { bodyWeight: 450, reproductiveStatus: "pregnant" },
    nirReference: "External reference only",
  });
  const result = buildReport(data);
  const batchId = await saveTest(data, result);
  const history = await readHistory(),
    saved = history.tests[0];
  assert.equal(saved.result.goal.selected, "reproduction");
  assert.equal(saved.result.animalContext.bodyWeight, 450);
  assert.equal(saved.result.nirReference, "External reference only");
  withGoal(saved.result, "profit");
  assert.equal(
    (await db.tests.get(saved.id)).result.goal.selected,
    "reproduction",
  );
  assert.equal(
    passportSummary({ id: batchId, feedType: data.feedType }, saved).goal,
    "reproduction",
  );
  assert.equal(goalHistory([saved])[0].selected, "reproduction");
  const old = { ...result };
  delete old.goal;
  assert.equal(asReport(old).goal, undefined);
  assert.equal(
    goalHistory([{ ...saved, result: old }])[0].status,
    "goalNotRecorded",
  );
});
