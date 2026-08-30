import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const COOKIE = "bb_vid";
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|preview/i;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_UA.test(ua)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let visitorId = req.cookies.get(COOKIE)?.value;
  const isNew = !visitorId;
  if (!visitorId || visitorId.length < 16 || visitorId.length > 80) {
    visitorId = randomUUID();
  }

  const now = new Date();
  await prisma.visitor.upsert({
    where: { id: visitorId },
    create: {
      id: visitorId,
      ipHash: hashIp(clientIp(req)),
      userAgent: ua.slice(0, 180),
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      lastSeenAt: now,
      ipHash: hashIp(clientIp(req)),
    },
  });

  const res = NextResponse.json({ ok: true, isNew });
  res.cookies.set(COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
