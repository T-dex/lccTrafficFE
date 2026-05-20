import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOMINATIM = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const USER_AGENT = process.env.USER_AGENT || "AltaDriveEstimator/1.0 (address autocomplete)";

/** Salt Lake valley — bias results without excluding other origins */
const VIEWBOX = "-112.2,40.4,-111.5,41.1";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    limit: "6",
    countrycodes: "us",
    viewbox: VIEWBOX,
    bounded: "0",
  });

  try {
    const upstream = await fetch(`${NOMINATIM}?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ detail: `Geocoder ${upstream.status}` }, { status: 502 });
    }
    const rows: unknown = await upstream.json();
    if (!Array.isArray(rows)) return NextResponse.json([]);

    const suggestions = rows.map((row) => {
      const r = row as {
        display_name?: string;
        lat?: string;
        lon?: string;
        address?: Record<string, string>;
      };
      const addr = r.address ?? {};
      const line =
        [addr.house_number, addr.road].filter(Boolean).join(" ") ||
        addr.road ||
        addr.neighbourhood ||
        addr.suburb ||
        "";
      const city = addr.city || addr.town || addr.village || addr.municipality || "";
      const state = addr.state || "";
      const short =
        line && city
          ? `${line}, ${city}${state ? `, ${state}` : ""}`
          : (r.display_name ?? "").split(",").slice(0, 3).join(", ");
      return {
        label: short || r.display_name || q,
        full: r.display_name || short || q,
      };
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Address search failed" },
      { status: 502 },
    );
  }
}
