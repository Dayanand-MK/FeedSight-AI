import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { db, saveTest } from "../src/db/index.js";
import { assess, presets } from "../src/services/assessment.js";
import { synchronize, checkCloudConnection } from "../src/services/sync.js";
import { cloudErrorKey } from "../src/services/cloudErrors.js";
import { buildReport } from "../src/services/report.js";
const input = { feedType: "maize_silage", source: "virtual", ...presets.low };
test("cloud errors distinguish credentials, missing schema and permissions", () => {
  assert.equal(
    cloudErrorKey({ code: "invalid_credentials" }),
    "invalidCredentials",
  );
  assert.equal(
    cloudErrorKey({ code: "email_not_confirmed" }),
    "emailNotConfirmed",
  );
  assert.equal(cloudErrorKey({ code: "PGRST205" }), "cloudTableMissing");
  assert.equal(cloudErrorKey({ code: "42501" }), "cloudPermissionDenied");
  assert.equal(
    cloudErrorKey(new TypeError("fetch failed")),
    "cloudUnreachable",
  );
});
test("connection check requires a user and reports table permission errors", async () => {
  await assert.rejects(() => checkCloudConnection(null), /notConfigured/);
  await assert.rejects(
    () =>
      checkCloudConnection({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    /signInRequired/,
  );
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "owner" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ limit: async () => ({ error: { code: "42501" } }) }),
      }),
    }),
  };
  await assert.rejects(
    () => checkCloudConnection(client),
    /cloudPermissionDenied/,
  );
});
function fakeCloud(owner = "user-a") {
  const rows = new Map();
  let failures = false;
  let sent = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: owner } } }) },
    from: () => ({
      upsert(row) {
        sent++;
        return {
          select: () => ({
            single: async () => {
              if (failures) return { error: new Error("disconnected") };
              rows.set(row.id, row);
              return { data: { id: row.id } };
            },
          }),
        };
      },
      select: () => ({
        eq: (_col, id) => ({
          order: () => ({
            range: async (start, end) => ({
              data: [...rows.values()]
                .filter((v) => v.owner_id === id)
                .slice(start, end + 1),
            }),
          }),
        }),
      }),
    }),
  };
  return {
    client,
    rows,
    setFailures: (value) => {
      failures = value;
    },
    sent: () => sent,
  };
}
test("offline failure, reconnect retry, idempotence and ownership", async () => {
  await db.tests.clear();
  await db.batches.clear();
  await saveTest(input, assess(input));
  const cloud = fakeCloud();
  cloud.setFailures(true);
  assert.equal((await synchronize(cloud.client)).failed, 1);
  let row = (await db.tests.toArray())[0];
  assert.equal(row.syncStatus, "failed");
  assert.equal(row.ownerId, "user-a");
  const other = fakeCloud("user-b");
  await synchronize(other.client);
  assert.equal(other.sent(), 0);
  cloud.setFailures(false);
  assert.equal((await synchronize(cloud.client)).uploaded, 1);
  await synchronize(cloud.client);
  assert.equal(cloud.rows.size, 1);
  assert.equal(cloud.sent(), 2);
  row = (await db.tests.toArray())[0];
  assert.equal(row.syncStatus, "synced");
  await db.tests.clear();
  await db.batches.clear();
  await synchronize(cloud.client);
  assert.equal(await db.tests.count(), 1);
  assert.equal(await db.batches.count(), 1);
  await synchronize(cloud.client);
  assert.equal(await db.tests.count(), 1);
});
test("missing cloud never marks records synchronized", async () => {
  await db.tests.clear();
  await saveTest(input, assess(input));
  await assert.rejects(() => synchronize(null), /notConfigured/);
  assert.equal((await db.tests.toArray())[0].syncStatus, "pending");
});

test("incomplete structured reports survive sync and retain unavailable score", async () => {
  await db.tests.clear();
  await db.batches.clear();
  const values = {
    ...input,
    goal: "reproduction",
    animalType: "heifer",
    animalContext: { bodyWeight: 320, reproductiveStatus: "unknown" },
    moisture: "",
    ph: "",
    humidity: "",
    temperature: "",
    mould: null,
    smell: null,
  };
  const report = buildReport(values);
  await saveTest(values, report);
  const cloud = fakeCloud();
  await synchronize(cloud.client);
  await db.tests.clear();
  await db.batches.clear();
  await synchronize(cloud.client);
  const row = (await db.tests.toArray())[0];
  assert.equal(row.result.overall.score, null);
  assert.equal(row.result.schemaVersion, 2);
  assert.deepEqual(row.result.goal, report.goal);
  assert.deepEqual(row.result.animalContext, report.animalContext);
  assert.equal(
    row.result.safety.items.find((i) => i.key === "urea").status,
    "notTested",
  );
});
