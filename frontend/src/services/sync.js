import { createClient } from "@supabase/supabase-js";
import { cloudFetch } from "./cloudFetch.js";
import { db } from "../db/index.js";
import { cloudErrorKey } from "./cloudErrors.js";
const url = import.meta.env?.VITE_SUPABASE_URL?.trim();
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim();
// Bad optional configuration must never prevent the local app from opening.
export let cloud = null;
try {
  if (url && key) cloud = createClient(url, key, { global: { fetch: cloudFetch } });
} catch {
  cloud = null;
}
let running;
export async function checkCloudConnection(client = cloud) {
  if (!client) throw new Error("notConfigured");
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(cloudErrorKey(error));
  if (!data.user) throw new Error("signInRequired");
  const response = await client.from("feedsight_records").select("id").eq("owner_id", data.user.id).limit(1);
  if (response.error) throw new Error(cloudErrorKey(response.error));
  return "cloudConnected";
}
export function synchronize(client = cloud) {
  if (running) return running;
  running = run(client).finally(() => {
    running = null;
  });
  return running;
}
async function run(client) {
  if (!client) throw new Error("notConfigured");
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(cloudErrorKey(error));
  if (!data.user) throw new Error("signInRequired");
  const ownerId = data.user.id;
  let failed = 0,
    uploaded = 0,
    downloaded = 0,
    errorKey = null;
  const pending = await db.tests
    .where("syncStatus")
    .anyOf("pending", "failed")
    .toArray();
  for (const item of pending) {
    if (item.ownerId && item.ownerId !== ownerId) continue;
    // Claim before sending so an ambiguous network response cannot upload to a different account.
    await db.tests.update(item.id, { ownerId });
    try {
      const batch = await db.batches.get(item.batchId);
      const input = {
        ...item.input,
        image: item.input.image
          ? { ...item.input.image, dataUrl: undefined }
          : null,
      };
      const test = { ...item, input, ownerId, syncStatus: "synced" };
      const response = await client
        .from("feedsight_records")
        .upsert(
          {
            id: item.id,
            owner_id: ownerId,
            created_at: item.createdAt,
            payload: { batch, test },
          },
          { onConflict: "id" },
        )
        .select("id")
        .single();
      if (response.error) throw response.error;
      if (response.data?.id !== item.id) throw new Error("syncError");
      await db.tests.update(item.id, { syncStatus: "synced" });
      uploaded++;
    } catch (error) {
      errorKey = cloudErrorKey(error);
      await db.tests.update(item.id, { syncStatus: "failed" });
      failed++;
    }
  }
  // Immutable test IDs avoid timestamp-based overwrites. Paginate to avoid the server's default row cap.
  for (let offset = 0; ; offset += 500) {
    const response = await client
      .from("feedsight_records")
      .select("*")
      .eq("owner_id", ownerId)
      .order("id")
      .range(offset, offset + 499);
    if (response.error) throw new Error(cloudErrorKey(response.error));
    for (const row of response.data) {
      const { batch, test } = row.payload || {};
      if (
        !batch?.id ||
        test?.id !== row.id ||
        test?.batchId !== batch.id ||
        !(
          Number.isFinite(test?.result?.score) ||
          (test?.result?.schemaVersion === 2 &&
            test.result.score === null &&
            test.result.overall?.score === null)
        )
      )
        continue;
      await db.transaction("rw", db.batches, db.tests, async () => {
        if (!(await db.tests.get(test.id))) {
          if (!(await db.batches.get(batch.id))) await db.batches.add(batch);
          await db.tests.add({ ...test, ownerId, syncStatus: "synced" });
          downloaded++;
        }
      });
    }
    if (response.data.length < 500) break;
  }
  return { uploaded, downloaded, failed, errorKey };
}
