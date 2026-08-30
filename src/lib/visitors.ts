import { prisma } from "./prisma";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

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
