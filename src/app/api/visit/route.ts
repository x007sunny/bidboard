import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders, tooManyRequests } from "@/lib/rateLimit";
import {
  hashIp,
  isPlausibleVisitorId,
  VISITOR_REUSE_WINDOW_MS,
} from "@/lib/visitors";

export const runtime = "nodejs";

const COOKIE = "bb_vid";
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|preview/i;

function withCookie(res: NextResponse, visitorId: string) {
  res.cookies.set(COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_UA.test(ua)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const ip = clientIpFromHeaders(req.headers);
  const ipHash = hashIp(ip);
  const now = new Date();
  const cookieId = req.cookies.get(COOKIE)?.value;

  if (isPlausibleVisitorId(cookieId)) {
    const existing = await prisma.visitor.findUnique({ where: { id: cookieId } });
    if (existing) {
      await prisma.visitor.update({
        where: { id: existing.id },
        data: { lastSeenAt: now, ipHash },
      });
      return withCookie(NextResponse.json({ ok: true, isNew: false }), existing.id);
    }
  }

  if (tooManyRequests(`visit:${ipHash}`, 30, 60_000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const recent = await prisma.visitor.findFirst({
    where: {
      ipHash,
      lastSeenAt: { gte: new Date(now.getTime() - VISITOR_REUSE_WINDOW_MS) },
    },
    orderBy: { lastSeenAt: "desc" },
  });
  if (recent) {
    await prisma.visitor.update({
      where: { id: recent.id },
      data: { lastSeenAt: now },
    });
    return withCookie(NextResponse.json({ ok: true, isNew: false }), recent.id);
  }

  const visitorId = randomUUID();
  await prisma.visitor.create({
    data: {
      id: visitorId,
      ipHash,
      userAgent: ua.slice(0, 180),
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
  return withCookie(NextResponse.json({ ok: true, isNew: true }), visitorId);
}
