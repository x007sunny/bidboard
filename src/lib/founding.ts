import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { listingWhere, type LeaderboardFilter } from "./listingWhere";
import {
  FOUNDING_LOCK_ID,
  FOUNDING_SIZE,
  pickFoundingMembers,
  rankFoundingMembers,
  type FounderInput,
} from "./foundingRank";

export {
  FOUNDING_LOCK_ID,
  FOUNDING_SIZE,
  defaultBoard,
  parseBoard,
  pickFoundingMembers,
  rankFoundingMembers,
} from "./foundingRank";
export type { BoardTab, FounderInput } from "./foundingRank";

export type FoundingListing = {
  id: string;
  liveListingId: string | null;
  foundingRank: number;
  url: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  states: string[];
  logoUrl: string | null;
  bidCents: number;
  clicks: number;
  lastBidAt: Date;
};

type SnapshotRow = FounderInput & {
  uniqueKey: string;
  url: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  states: string[];
  logoUrl: string | null;
  clicks: number;
};

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function getFoundingLock() {
  return prisma.foundingLock.findUnique({ where: { id: FOUNDING_LOCK_ID } });
}

export async function ensureFoundingState(): Promise<{ locked: boolean; lockedAt: Date | null }> {
  try {
    const lock = await getFoundingLock();
    if (lock) return { locked: true, lockedAt: lock.lockedAt };
    await lockFounding50IfReady();
    const again = await getFoundingLock();
    return { locked: !!again, lockedAt: again?.lockedAt ?? null };
  } catch (err) {
    console.error("Founding 50 state unavailable:", err);
    return { locked: false, lockedAt: null };
  }
}

/**
 * Snapshot the first 50 listings and insert FoundingLock.
 * Own transaction — never inside the Stripe payment tx, so a lock race cannot
 * roll back a successful bid.
 *
 * Safe to call on every webhook/homepage: no-ops when already locked or < 50.
 * Unique(id) on FoundingLock + unique foundingRank make a double lock impossible.
 */
export async function lockFounding50IfReady(): Promise<boolean> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existing = await tx.foundingLock.findUnique({
          where: { id: FOUNDING_LOCK_ID },
        });
        if (existing) return true;

        const listingCount = await tx.listing.count();
        if (listingCount < FOUNDING_SIZE) return false;

        const already = await tx.foundingMember.count();
        if (already >= FOUNDING_SIZE) {
          await tx.foundingLock.create({
            data: { id: FOUNDING_LOCK_ID, lockedAt: new Date() },
          });
          return true;
        }

        const rows = await tx.$queryRaw<SnapshotRow[]>`
          SELECT
            id,
            "uniqueKey",
            url,
            title,
            description,
            category,
            subcategory,
            states,
            "logoUrl",
            "bidCents",
            clicks,
            "lastBidAt",
            "createdAt"
          FROM "Listing"
          ORDER BY "createdAt" ASC, id ASC
          LIMIT ${FOUNDING_SIZE}
          FOR UPDATE
        `;

        const ranked = rankFoundingMembers(pickFoundingMembers(rows));
        if (ranked.length < FOUNDING_SIZE) return false;

        await tx.foundingMember.createMany({
          data: ranked.map((r) => ({
            foundingRank: r.foundingRank,
            listingId: r.id,
            uniqueKey: r.uniqueKey,
            url: r.url,
            title: r.title,
            description: r.description,
            category: r.category,
            subcategory: r.subcategory,
            states: r.states ?? [],
            logoUrl: r.logoUrl,
            bidCents: r.bidCents,
            clicks: r.clicks,
            lastBidAt: r.lastBidAt,
          })),
        });

        await tx.foundingLock.create({
          data: { id: FOUNDING_LOCK_ID, lockedAt: new Date() },
        });
        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (err) {
    if (isUniqueViolation(err)) return true;
    throw err;
  }
}

export async function getFoundingArchive(
  limit = 50,
  page = 1,
  filter: LeaderboardFilter = {}
) {
  const skip = (page - 1) * limit;
  const where = listingWhere(filter) as Prisma.FoundingMemberWhereInput;
  const [rows, total] = await Promise.all([
    prisma.foundingMember.findMany({
      where,
      orderBy: { foundingRank: "asc" },
      take: limit,
      skip,
    }),
    prisma.foundingMember.count({ where }),
  ]);

  const listings: FoundingListing[] = rows.map((m) => ({
    id: m.listingId || m.id,
    liveListingId: m.listingId,
    foundingRank: m.foundingRank,
    url: m.url,
    title: m.title,
    description: m.description,
    category: m.category,
    subcategory: m.subcategory,
    states: m.states,
    logoUrl: m.logoUrl,
    bidCents: m.bidCents,
    clicks: m.clicks,
    lastBidAt: m.lastBidAt,
  }));

  return { listings, total, page, limit };
}

export async function getFoundingCategoryCounts(): Promise<Record<string, number>> {
  const groups = await prisma.foundingMember.groupBy({
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

export async function getFoundingSubcategoryCounts(
  category: string,
  state?: string
): Promise<Record<string, number>> {
  if (!category || category === "All") return {};
  const where = listingWhere({ category, state }) as Prisma.FoundingMemberWhereInput;
  const groups = await prisma.foundingMember.groupBy({
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
