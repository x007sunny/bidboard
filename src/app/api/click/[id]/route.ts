import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HOME = "https://www.bidboard.com.au";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.length > 40) {
    return NextResponse.redirect(HOME, 302);
  }

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { url: true },
    });

    let target = listing.url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.redirect(HOME, 302);
    }

    return NextResponse.redirect(parsed.toString(), 302);
  } catch {
    return NextResponse.redirect(HOME, 302);
  }
}
