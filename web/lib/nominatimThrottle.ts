/** Serialize Nominatim calls (max ~1/sec) within a single serverless instance. */
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;
let chain: Promise<unknown> = Promise.resolve();

export function nominatimFetch(url: string, init?: RequestInit): Promise<Response> {
  const run = async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    const response = await fetch(url, init);
    if (response.status !== 429) return response;

    const retryAfter = Number(response.headers.get("Retry-After"));
    const retryWait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 2000;
    await new Promise((r) => setTimeout(r, Math.min(retryWait, 10000)));
    lastCallAt = Date.now();
    return fetch(url, init);
  };
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}
