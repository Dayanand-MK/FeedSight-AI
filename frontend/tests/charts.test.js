import test from "node:test";
import assert from "node:assert/strict";
import { biomassParts, trendRows } from "../src/services/charts.js";
test("biomass shares exclude overlapping totals and reject invalid numbers", () => {
  const parts = biomassParts({
    Dry_Green_g: 20,
    Dry_Dead_g: 10,
    Dry_Clover_g: 10,
    GDM_g: 30,
    Dry_Total_g: 40,
  });
  assert.deepEqual(
    parts.map((r) => r.percent),
    [50, 25, 25],
  );
  assert.equal(biomassParts({}).length, 0);
  assert.ok(
    biomassParts({ Dry_Green_g: 0, Dry_Dead_g: 0, Dry_Clover_g: 0 }).every(
      (r) => r.percent === null,
    ),
  );
});
test("history charts retain missing readings and separate simulation from observations", () => {
  const row = (id, source, value) => ({
    id,
    createdAt: `2026-09-0${id}`,
    result: { storage: { source, readings: { moisture: value } } },
  });
  const rows = trendRows(
    [row(3, "manual", 20), row(2, "virtual", 50), row(1, "manual", null)],
    "moisture",
    "manual",
  );
  assert.deepEqual(
    rows.map((r) => r.value),
    [null, 20],
  );
  assert.equal(trendRows([], "invented", "manual").length, 0);
});
