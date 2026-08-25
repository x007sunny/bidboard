import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { url: true },
    });

    let target = listing.url;
    if (!target.startsWith("http")) {
      target = `https://${target}`;
    }

    return NextResponse.redirect(target, 302);
  } catch {
    return NextResponse.redirect("https://bidboard.com.au", 302);
  }
}
