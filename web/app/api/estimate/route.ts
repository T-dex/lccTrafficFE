import { proxyBackend } from "../_backend";

/**
 * Explicit proxy so POST bodies always reach the Express/FastAPI backend as-is.
 * Rewrites can behave inconsistently for some POST + JSON setups in dev/prod.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  return proxyBackend("/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw.length ? raw : "{}",
  });
}
