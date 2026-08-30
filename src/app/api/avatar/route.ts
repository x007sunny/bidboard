import { NextRequest, NextResponse } from "next/server";
import { downloadFacebookAvatar, downloadInstagramAvatar } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const fb = req.nextUrl.searchParams.get("fb");
  const ig = req.nextUrl.searchParams.get("ig");
  const handle = (fb || ig || "").trim();
  if (!handle || handle.length > 80) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const file = ig
      ? await downloadInstagramAvatar(handle)
      : await downloadFacebookAvatar(handle);
    if (!file) return new NextResponse(null, { status: 404 });
    return new NextResponse(file.bytes, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
