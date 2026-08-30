import { NextRequest, NextResponse } from "next/server";
import { resolveSocialImage } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const fb = req.nextUrl.searchParams.get("fb");
  const ig = req.nextUrl.searchParams.get("ig");
  const kind = fb ? "facebook" : ig ? "instagram" : null;
  const handle = (fb || ig || "").trim();
  if (!kind || !handle || handle.length > 80) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const imageUrl = await resolveSocialImage(kind, handle);
    if (!imageUrl) return new NextResponse(null, { status: 404 });

    const img = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });
    if (!img.ok) return new NextResponse(null, { status: 404 });

    const contentType = img.headers.get("content-type") || "image/jpeg";
    const buf = await img.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
