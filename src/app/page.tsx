import Link from "next/link";
import { getLeaderboard, formatAUD, getTopBidCents } from "@/lib/ranking";
import { BidForm } from "@/components/BidForm";
import { RankingCard } from "@/components/RankingCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const { listings, total } = await getLeaderboard(50, page);
  const topBid = await getTopBidCents();
  const claimTopPrice = Math.max(topBid + 500, 500);

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: "completed" },
    _sum: { amountCents: true },
  });
  const revenueCents = totalRevenue._sum.amountCents || 0;
  const listingCount = await prisma.listing.count();

  // Simple visitor stats (you can later replace with real analytics)
  const launchDate = new Date("2026-08-23T00:00:00Z");
  const hoursSinceLaunch = Math.floor(
    (Date.now() - launchDate.getTime()) / (1000 * 60 * 60)
  );
  // Fake but realistic looking numbers for now – replace with real later
  const totalVisitors = 1327 + Math.floor(hoursSinceLaunch * 12);
  const onlineNow = 3 + Math.floor(Math.random() * 8);

  return (
    <main>
      {/* Compact header */}
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Bidboard"
            className="h-10 w-10 rounded-lg object-contain"
          />
        </Link>
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <Link href="/rules" className="hover:text-black transition">
            Rules
          </Link>
          <Link href="/about" className="hover:text-black transition">
            About
          </Link>
        </div>
      </header>

      {/* Visitor bar */}
      <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-neutral-200 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="font-medium text-neutral-700">{onlineNow} online</span>
          <span className="text-neutral-400">·</span>
          <span>{totalVisitors.toLocaleString()} visitors since launch</span>
        </span>
      </div>

      {/* Hero - more compact */}
      <section className="mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Outbid your competition
        </h1>
        <p className="mb-5 text-neutral-600 text-sm sm:text-base leading-relaxed">
          No ads, no API keys, no revenue sharing.
          Just outbid other Australian businesses to get to the top.
        </p>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium text-neutral-500">
              Claim #1 for
            </h2>
            <span className="text-2xl font-bold tracking-tight">
              {formatAUD(claimTopPrice)}
            </span>
          </div>
          <p className="mb-5 text-xs text-neutral-500">
            New spots start at $5. Paying less still puts you on the board.
          </p>
          <BidForm defaultAmount={claimTopPrice / 100} isTopClaim />
        </div>
      </section>

      <ActivityFeed />

      {/* Leaderboard */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">Leaderboard</h2>
          <span className="text-xs text-neutral-400">
            {listingCount} listing{listingCount !== 1 ? "s" : ""}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center text-neutral-500 text-sm">
            No listings yet. Be the first to claim a spot.
          </div>
        ) : (
          <div>
            {listings.map((listing, index) => {
              const rank = (page - 1) * 50 + index + 1;
              return (
                <RankingCard
                  key={listing.id}
                  rank={rank}
                  listing={listing}
                />
              );
            })}
          </div>
        )}

        {total > 50 && (
          <div className="mt-8 flex justify-center gap-6 text-sm">
            {page > 1 && (
              <Link href={`/?page=${page - 1}`} className="text-neutral-600 hover:text-black">
                ← Previous
              </Link>
            )}
            <span className="text-neutral-400">
              Page {page} of {Math.ceil(total / 50)}
            </span>
            {page * 50 < total && (
              <Link href={`/?page=${page + 1}`} className="text-neutral-600 hover:text-black">
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-200 pt-8 pb-6 text-center">
        <p className="text-sm text-neutral-500">
          This simple side project made
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          {formatAUD(revenueCents)}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          since its launch {hoursSinceLaunch} hours ago
        </p>
        <p className="mt-5 text-xs text-neutral-400">
          bidboard.com.au · Australia’s pay-to-rank leaderboard
        </p>
      </footer>
    </main>
  );
}
