import { NextResponse } from "next/server";

function normalizeBackendUrl(raw: string) {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function backendBaseUrl() {
  return normalizeBackendUrl(process.env.BACKEND_URL || "http://127.0.0.1:8765");
}

export function backendDiagnostics() {
  const configured = Boolean(process.env.BACKEND_URL?.trim());
  try {
    const url = new URL(backendBaseUrl());
    return {
      configured,
      origin: url.origin,
      hostname: url.hostname,
    };
  } catch {
    return {
      configured,
      origin: "invalid BACKEND_URL",
      hostname: "invalid BACKEND_URL",
    };
  }
}

export async function proxyBackend(path: string, init: RequestInit) {
  const url = `${backendBaseUrl()}${path}`;
  try {
    const upstream = await fetch(url, {
      ...init,
      cache: "no-store",
    });
    const text = await upstream.text();
    const ct = upstream.headers.get("content-type") ?? "application/json";
    return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": ct } });
  } catch (error) {
    return NextResponse.json(
      {
        detail: "Could not reach backend from Vercel function",
        backend: backendDiagnostics(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
