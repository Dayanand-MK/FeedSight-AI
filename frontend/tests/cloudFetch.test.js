import test from "node:test";
import assert from "node:assert/strict";
import { cloudFetch } from "../src/services/cloudFetch.js";
const hanging = (_, {signal}) => new Promise((resolve, reject) => {
  if (signal.aborted) reject(signal.reason);
  else signal.addEventListener("abort", () => reject(signal.reason), {once:true});
});
test("cloud request times out rather than hanging indefinitely", async () => {
  await assert.rejects(cloudFetch("test", {}, hanging, 10), {name:"AbortError"});
});
test("cloud fetch respects caller cancellation and successful responses", async () => {
  const controller = new AbortController();
  const request = cloudFetch("test", {signal:controller.signal}, hanging, 1000);
  controller.abort();
  await assert.rejects(request, {name:"AbortError"});
  assert.equal(await cloudFetch("test", {}, async () => "ok", 10), "ok");
});
