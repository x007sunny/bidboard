export const FOUNDING_SIZE = 50;
export const FOUNDING_LOCK_ID = "founding50";

export type BoardTab = "founding" | "leaderboard";

export type FounderInput = {
  id: string;
  createdAt: Date;
  lastBidAt: Date;
  bidCents: number;
};

/** First 50 unique businesses, by join time. Later listings never join the set. */
export function pickFoundingMembers<T extends FounderInput>(listings: T[]): T[] {
  return [...listings]
    .sort((a, b) => +a.createdAt - +b.createdAt || a.id.localeCompare(b.id))
    .slice(0, FOUNDING_SIZE);
}

/** Permanent ranks = leaderboard order at lock (bid desc, older lastBidAt first). */
export function rankFoundingMembers<T extends FounderInput>(
  members: T[]
): (T & { foundingRank: number })[] {
  return [...members]
    .sort(
      (a, b) =>
        b.bidCents - a.bidCents ||
        +a.lastBidAt - +b.lastBidAt ||
        a.id.localeCompare(b.id)
    )
    .map((m, i) => ({ ...m, foundingRank: i + 1 }));
}

export function defaultBoard(locked: boolean): BoardTab {
  return locked ? "leaderboard" : "founding";
}

export function parseBoard(raw: string | undefined, locked: boolean): BoardTab {
  if (raw === "founding" || raw === "leaderboard") return raw;
  return defaultBoard(locked);
}
