import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { parseSocialUrl } from "./social";
import { listingWhere, type LeaderboardFilter } from "./listingWhere";

export type { LeaderboardFilter };
export { listingWhere };

export function normalizeUrlOrHandle(input: string): { uniqueKey: string; title: string; isHandle: boolean } {
  let cleaned = input.trim();

  if (cleaned.startsWith("@")) {
    const handle = cleaned.toLowerCase().replace(/[^a-z0-9_]/g, "");
    return {
      uniqueKey: `handle:${handle}`,
      title: `@${handle}`,
      isHandle: true,
    };
  }

  const social = parseSocialUrl(cleaned);
  if (social) {
    return {
      uniqueKey: `${social.kind}:${social.handle.toLowerCase()}`,
      title: social.kind === "instagram" ? `@${social.handle}` : social.handle,
      isHandle: false,
    };
  }

  try {
    if (!cleaned.startsWith("http")) cleaned = `https://${cleaned}`;
    const url = new URL(cleaned);
    url.search = "";
    url.hash = "";
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    const uniqueKey = `url:${host}${path}`.toLowerCase();
    const title = path ? `${host}${path}` : host;
    return { uniqueKey, title, isHandle: false };
  } catch {
    const domain = cleaned.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return {
      uniqueKey: `url:${domain}`,
      title: domain,
      isHandle: false,
    };
  }
}

export async function getLeaderboard(limit = 100, page = 1, filter: LeaderboardFilter = {}) {
  const skip = (page - 1) * limit;
  const where = listingWhere(filter) as Prisma.ListingWhereInput;
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
      take: limit,
      skip,
    }),
    prisma.listing.count({ where }),
  ]);
  return { listings, total, page, limit };
}

export async function getBidLadder() {
  return prisma.listing.findMany({
    select: { id: true, bidCents: true },
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
  });
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const groups = await prisma.listing.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = { All: 0 };
  for (const g of groups) {
    counts[g.category] = g._count._all;
    counts.All += g._count._all;
  }
  return counts;
}

export async function getSubcategoryCounts(
  category: string,
  state?: string
): Promise<Record<string, number>> {
  if (!category || category === "All") return {};
  const where = listingWhere({ category, state }) as Prisma.ListingWhereInput;
  const groups = await prisma.listing.groupBy({
    by: ["subcategory"],
    where: { ...where, subcategory: { not: null } },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of groups) {
    if (g.subcategory) counts[g.subcategory] = g._count._all;
  }
  return counts;
}

export async function getTopBidCents(): Promise<number> {
  const top = await prisma.listing.findFirst({
    orderBy: { bidCents: "desc" },
    select: { bidCents: true },
  });
  return top?.bidCents ?? 0;
}

export function formatAUD(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-AU");
}
