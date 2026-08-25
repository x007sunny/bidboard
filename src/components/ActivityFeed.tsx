import { prisma } from "@/lib/prisma";
import { formatAUD, timeAgo } from "@/lib/ranking";
import Link from "next/link";

export async function ActivityFeed() {
  const recent = await prisma.listing.findMany({
    orderBy: { lastBidAt: "desc" },
    take: 5,
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

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-medium text-neutral-500">Latest activity</h2>
      <ul className="space-y-2 text-sm">
        {recent.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-neutral-600">
            <Link href={`/#ranking-entry-${item.id}`} className="hover:text-black hover:underline">
              {item.title}
            </Link>
            <span className="text-neutral-400">
              at #{rankMap.get(item.id) ?? "?"} · {formatAUD(item.bidCents)}
            </span>
            <span className="text-neutral-400">· {timeAgo(item.lastBidAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
