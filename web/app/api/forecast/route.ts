import { proxyBackend } from "../_backend";

export async function POST(req: Request) {
  const raw = await req.text();
  return proxyBackend("/api/forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw.length ? raw : "{}",
  });
}
