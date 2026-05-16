import { NextResponse } from "next/server";
import { backendBaseUrl, backendDiagnostics } from "../_backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const url = `${backendBaseUrl()}/api/health`;
  try {
    const upstream = await fetch(url, { cache: "no-store" });
    const text = await upstream.text();
    return NextResponse.json({
      ok: upstream.ok,
      status: upstream.status,
      elapsed_ms: Date.now() - startedAt,
      backend: backendDiagnostics(),
      body: text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        elapsed_ms: Date.now() - startedAt,
        backend: backendDiagnostics(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
