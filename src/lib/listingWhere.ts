import { AU_NATIONAL, AU_STATES } from "./categories";

export type LeaderboardFilter = {
  category?: string;
  subcategory?: string;
  state?: string;
};

/**
 * Prisma `where` for the public leaderboard.
 * Filtering happens in the database — never by slicing the top 200 rows in JS.
 *
 * "Australia" (AU) means ALL Australian listings: VIC-only, multi-state,
 * national, and rows with empty `states`. It is not "nationwide only".
 * A specific state uses `states has that code` (national rows include every
 * state code so they still match).
 */
export function listingWhere(filter: LeaderboardFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filter.category && filter.category !== "All") {
    where.category = filter.category;
  }
  if (filter.subcategory) {
    where.subcategory = filter.subcategory;
  }
  const state = (filter.state || "").toUpperCase();
  if (state === AU_NATIONAL) {
    // All Australian listings — no states predicate.
  } else if (state && AU_STATES.includes(state as (typeof AU_STATES)[number])) {
    where.states = { has: state };
  }
  return where;
}

export function matchesListingWhere(
  listing: { category: string; subcategory?: string | null; states?: string[] | null },
  filter: LeaderboardFilter
): boolean {
  const where = listingWhere(filter);
  if (where.category && listing.category !== where.category) return false;
  if (where.subcategory && listing.subcategory !== where.subcategory) return false;
  const has = (where.states as { has?: string } | undefined)?.has;
  if (has && !(listing.states || []).includes(has)) return false;
  return true;
}
