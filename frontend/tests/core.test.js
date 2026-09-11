import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import {
  assess,
  presets,
  sensorAdapter,
  declining,
} from "../src/services/assessment.js";
import { db, saveTest, readHistory } from "../src/db/index.js";
import { strings, translate } from "../src/locales/index.js";
const input = (patch = {}) => ({
  feedType: "maize_silage",
  source: "virtual",
  ...presets.low,
  ...patch,
});
test("low, moderate and high scenarios give deterministic explained scores", () => {
  for (const [key, expected] of [
    ["low", 100],
    ["moderate", 60],
    ["high", 0],
  ]) {
    const result = assess(input(presets[key]));
    assert.equal(result.score, expected);
    assert.equal(
      result.score,
      Math.max(0, 100 - result.reasons.reduce((s, r) => s + r.points, 0)),
    );
    assert.equal(result.confidence, null);
    assert.equal(result.nutrition, null);
  }
});
test("humidity, moisture and silage pH affect score independently", () => {
  assert.equal(assess(input({ humidity: 90 })).score, 85);
  assert.equal(assess(input({ moisture: 80 })).score, 80);
  assert.equal(assess(input({ ph: 5.8 })).score, 80);
  assert.equal(
    assess(input({ feedType: "dry_feed", moisture: 12, ph: 6 })).score,
    100,
  );
});
test("mould alone must trigger high risk and conservative advice", () => {
  const r = assess(input({ mould: true }));
  assert.equal(r.risk, "high");
  assert.ok(r.advisories.includes("isolate"));
});
test("invalid and missing readings rejected", () => {
  for (const patch of [
    { ph: 15 },
    { ph: "" },
    { moisture: -1 },
    { humidity: 101 },
    { temperature: NaN },
    { storageAge: null },
    { source: "fabricated" },
  ])
    assert.throws(() => assess(input(patch)));
});
test("photo absence is valid and photo content does not invent measurements", () => {
  assert.equal(assess(input()).visual, "noImage");
  const r = assess(input({ image: { name: "feed.jpg" } }));
  assert.equal(r.visual, "unavailable");
  assert.equal(r.score, 100);
});
test("sensor provenance remains explicit", () => {
  for (const source of ["manual", "virtual", "dataset", "device"])
    assert.equal(sensorAdapter(presets.low, source).source, source);
});
test("all bundled translations have three nonempty strings", () => {
  for (const [key, values] of Object.entries(strings)) {
    assert.equal(values.length, 3, key);
    for (const v of values) assert.ok(v.length, key);
  }
  assert.equal(translate("ta", "newTest"), "புதிய தீவன சோதனை");
  assert.equal(translate("hi", "newTest"), "नया चारा परीक्षण");
});
test("atomic save, repeated tests on same batch, and declining history", async () => {
  await db.tests.clear();
  await db.batches.clear();
  const id = await saveTest(input({ batchName: "Test lot" }), assess(input()));
  await saveTest(input(presets.high), assess(input(presets.high)), id);
  const history = await readHistory();
  assert.equal(history.batches.length, 1);
  assert.equal(history.tests.length, 2);
  assert.ok(declining(history.tests));
  assert.ok(history.tests.every((r) => r.syncStatus === "pending"));
  await assert.rejects(() =>
    saveTest(input({ feedType: "dry_feed" }), assess(input()), id),
  );
  assert.equal(await db.tests.count(), 2);
});
test("browser model matches sklearn on real held fixtures", async () => {
  const model = JSON.parse(
    await readFile(
      new URL("../public/models/fqi-browser.json", import.meta.url),
    ),
  );
  const fixtures = JSON.parse(
    await readFile(
      new URL("../../ai/evaluation/browser_parity.json", import.meta.url),
    ),
  );
  globalThis.fetch = async () => ({ ok: true, json: async () => model });
  const { predictLocal } = await import("../src/services/fqiLocal.js");
  for (const row of fixtures)
    assert.ok(
      Math.abs((await predictLocal(row.input)).value - row.expected) < 1e-8,
    );
  await assert.rejects(() => predictLocal({}), /missingLab/);
  await assert.rejects(
    () => predictLocal({ ...fixtures[0].input, pH: 14 }),
    /outsideDomain/,
  );
});
