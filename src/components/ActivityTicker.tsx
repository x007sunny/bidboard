import { prisma } from "@/lib/prisma";
import { formatAUD, timeAgo } from "@/lib/ranking";
import Link from "next/link";

type TickerEvent = {
  key: string;
  listingId: string;
  title: string;
  kind: "up" | "down";
  verb: string;
  rank: number | string;
  amountCents: number;
  at: Date;
};

function shortTitle(title: string) {
  const cut = title.split("|")[0].trim();
  return cut.length > 36 ? `${cut.slice(0, 34)}…` : cut;
}

export async function ActivityTicker() {
  const ranked = await prisma.listing.findMany({
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
    select: { id: true, title: true, bidCents: true, lastBidAt: true },
  });
  const rankMap = new Map(ranked.map((l, i) => [l.id, i + 1]));

  const payments = await prisma.payment.findMany({
    where: { status: "completed" },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: {
      listing: {
        select: { id: true, title: true, bidCents: true, lastBidAt: true },
      },
    },
  });

  const events: TickerEvent[] = [];
  const seenDrop = new Set<string>();

  for (const payment of payments) {
    const listing = payment.listing;
    if (!listing) continue;
    const rank = rankMap.get(listing.id) ?? "?";
    const at = payment.completedAt || payment.createdAt;
    const isNew = payment.previousBidCents == null;

    events.push({
      key: `up-${payment.id}`,
      listingId: listing.id,
      title: listing.title,
      kind: "up",
      verb: isNew ? "joined at" : "raised to",
      rank,
      amountCents: payment.newBidCents || listing.bidCents,
      at,
    });

    if (typeof rank === "number") {
      const displaced = ranked[rank]; // next listing (0-based index == rank)
      if (
        displaced &&
        displaced.id !== listing.id &&
        !seenDrop.has(displaced.id) &&
        displaced.lastBidAt <= at
      ) {
        seenDrop.add(displaced.id);
        events.push({
          key: `down-${payment.id}-${displaced.id}`,
          listingId: displaced.id,
          title: displaced.title,
          kind: "down",
          verb: "dropped to",
          rank: rank + 1,
          amountCents: displaced.bidCents,
          at,
        });
      }
    }
  }

  if (events.length === 0) {
    for (const item of ranked.slice(0, 8)) {
      events.push({
        key: `up-${item.id}`,
        listingId: item.id,
        title: item.title,
        kind: "up",
        verb: "raised to",
        rank: rankMap.get(item.id) ?? "?",
        amountCents: item.bidCents,
        at: item.lastBidAt,
      });
    }
  }

  if (events.length === 0) return null;

  const loop = [...events, ...events];

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="flex animate-ticker whitespace-nowrap py-2 text-xs text-neutral-600">
        {loop.map((item) => (
          <Link
            key={item.key}
            href={`/#listing-${item.listingId}`}
            className="mx-5 inline-flex items-center gap-2 hover:text-black"
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${
                item.kind === "up" ? "bg-emerald-500" : "bg-rose-400"
              }`}
            >
              {item.kind === "up" ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                  <path d="M6 2.2 2.6 6.2h2.2V9.8h2.4V6.2h2.2Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                  <path d="M6 9.8 9.4 5.8H7.2V2.2H4.8v3.6H2.6Z" fill="currentColor" />
                </svg>
              )}
            </span>
            <span>
              <span className="font-medium text-neutral-800">{shortTitle(item.title)}</span>
              {" "}
              {item.verb} #{item.rank}
              <span className="text-neutral-400"> · </span>
              <span>{formatAUD(item.amountCents)}</span>
              <span className="text-neutral-400"> · </span>
              <span>{timeAgo(item.at)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
