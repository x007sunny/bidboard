import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
/** Same hashed IP reuses one visitor row for this long, so rotating cookies cannot inflate the count. */
export const VISITOR_REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function hashIp(ip: string): string {
  const salt = process.env.ADMIN_PASSWORD || "bidboard-visitor";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function isPlausibleVisitorId(id: string | undefined): boolean {
  if (!id) return false;
  return id.length >= 16 && id.length <= 80;
}

export async function getVisitorStats(): Promise<{
  totalVisitors: number;
  onlineNow: number;
}> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [totalVisitors, onlineNow] = await Promise.all([
    prisma.visitor.count(),
    prisma.visitor.count({ where: { lastSeenAt: { gte: since } } }),
  ]);
  return { totalVisitors, onlineNow };
}
