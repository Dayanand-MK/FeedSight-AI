import Dexie from "dexie";
import { asReport } from "../services/report.js";
export const db = new Dexie("feedsight-local");
db.version(1).stores({
  batches: "id, createdAt",
  tests: "id, batchId, createdAt, syncStatus, ownerId",
  profile: "id",
});
export async function saveTest(input, result, batchId, ownerId = null) {
  const createdAt = result.timestamp || new Date().toISOString();
  const id = crypto.randomUUID();
  const targetId = batchId || crypto.randomUUID();
  await db.transaction("rw", db.batches, db.tests, async () => {
    const batch = await db.batches.get(targetId);
    if (batch && batch.feedType !== input.feedType)
      throw new Error("batchMismatch");
    if (!batch)
      await db.batches.add({
        id: targetId,
        name: input.batchName?.trim() || `Feed ${createdAt.slice(0, 10)}`,
        feedType: input.feedType,
        createdAt,
      });
    await db.tests.add({
      id,
      batchId: targetId,
      createdAt,
      input,
      result: { ...result, batchId: targetId },
      ownerId,
      syncStatus: "pending",
    });
  });
  return targetId;
}
export async function readHistory() {
  return {
    batches: await db.batches.orderBy("createdAt").reverse().toArray(),
    tests: (await db.tests.orderBy("createdAt").toArray()).map((row) => ({
      ...row,
      result: asReport(row.result, row.input, row.createdAt, row.batchId),
    })),
  };
}
