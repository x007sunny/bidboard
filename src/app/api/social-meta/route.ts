import { NextRequest, NextResponse } from "next/server";
import { socialCardAssets } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") || "").trim();
  if (!url || url.length > 500) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  try {
    const meta = await socialCardAssets(url);
    if (!meta) return NextResponse.json({ error: "Not a social url" }, { status: 404 });
    return NextResponse.json(meta, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 });
  }
}
