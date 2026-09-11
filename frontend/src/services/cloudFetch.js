// Bound cloud requests so a lost connection cannot leave the controls busy forever.
export async function cloudFetch(input, init = {}, fetcher = fetch, timeoutMs = 15000) {
  const controller = new AbortController();
  const abort = () => controller.abort(init.signal?.reason);
  if (init.signal?.aborted) abort();
  else init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}
