import { prisma } from "@/lib/prisma";
import { formatAUD, timeAgo } from "@/lib/ranking";
import Link from "next/link";

export async function ActivityTicker() {
  const recent = await prisma.listing.findMany({
    orderBy: { lastBidAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      bidCents: true,
      lastBidAt: true,
    },
  });

  if (recent.length === 0) return null;

  const allOrdered = await prisma.listing.findMany({
    orderBy: [{ bidCents: "desc" }, { lastBidAt: "asc" }],
    select: { id: true },
  });
  const rankMap = new Map(allOrdered.map((l, i) => [l.id, i + 1]));

  const items = recent.map((item) => ({
    ...item,
    rank: rankMap.get(item.id) ?? "?",
  }));

  // Duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="mb-3 overflow-hidden border-y border-neutral-100 bg-white/60">
      <div className="flex animate-ticker whitespace-nowrap py-2 text-xs text-neutral-500">
        {loop.map((item, i) => (
          <span key={`${item.id}-${i}`} className="mx-6 inline-flex items-center gap-1.5">
            <Link href={`/#listing-${item.id}`} className="hover:text-black hover:underline">
              {item.title}
            </Link>
            <span>at #{item.rank}</span>
            <span>·</span>
            <span className="font-medium text-neutral-700">{formatAUD(item.bidCents)}</span>
            <span>·</span>
            <span>{timeAgo(item.lastBidAt)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
