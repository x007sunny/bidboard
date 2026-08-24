import Link from "next/link";
import Image from "next/image";
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

  // Simple stats for footer
  const totalRevenue = await prisma.payment.aggregate({
    where: { status: "completed" },
    _sum: { amountCents: true },
  });
  const revenueCents = totalRevenue._sum.amountCents || 0;
  const listingCount = await prisma.listing.count();

  // Launch time (you can change this date)
  const launchDate = new Date("2026-08-23T00:00:00Z");
  const hoursSinceLaunch = Math.floor(
    (Date.now() - launchDate.getTime()) / (1000 * 60 * 60)
  );

  return (
    <main>
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo - replace /logo.png with your actual logo later */}
          <img src="/logo.png" alt="Bidboard" className="h-8 w-8 rounded-md object-contain" />
          <span className="text-lg font-semibold tracking-tight">
            bidboard<span className="text-neutral-400">.com.au</span>
          </span>
        </Link>
        <div className="flex gap-5 text-sm text-neutral-500">
          <Link href="/rules" className="hover:text-black transition">
            Rules
          </Link>
          <Link href="/about" className="hover:text-black transition">
            About
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mb-10">
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Outbid your competition
        </h1>
        <p className="mb-8 text-neutral-600 leading-relaxed">
          No ads, no API keys, no revenue sharing.
          <br />
          Just outbid other Australian businesses to get to the top.
        </p>

        {/* Claim #1 box */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <h2 className="text-base font-medium text-neutral-600">
              Claim #1 for
            </h2>
            <span className="text-3xl font-bold tracking-tight">
              {formatAUD(claimTopPrice)}
            </span>
          </div>
          <p className="mb-6 text-sm text-neutral-500">
            New spots start at $5. Paying less than the #1 price still puts you
            on the board at whatever place that bid can take.
          </p>
          <BidForm defaultAmount={claimTopPrice / 100} isTopClaim />
        </div>
      </section>

      {/* Latest activity */}
      <ActivityFeed />

      {/* Leaderboard */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Leaderboard</h2>
          <span className="text-sm text-neutral-400">
            {listingCount} listing{listingCount !== 1 ? "s" : ""}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 py-20 text-center text-neutral-500">
            No listings yet. Be the first to claim a spot.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
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

        {/* Pagination */}
        {total > 50 && (
          <div className="mt-10 flex justify-center gap-6 text-sm">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}`}
                className="text-neutral-600 hover:text-black"
              >
                ← Previous
              </Link>
            )}
            <span className="text-neutral-400">
              Page {page} of {Math.ceil(total / 50)}
            </span>
            {page * 50 < total && (
              <Link
                href={`/?page=${page + 1}`}
                className="text-neutral-600 hover:text-black"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Footer like outbid.lol */}
      <footer className="mt-20 border-t border-neutral-100 pt-8 pb-4 text-center">
        <p className="text-sm text-neutral-500">
          This simple side project made
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          {formatAUD(revenueCents)}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          since its launch {hoursSinceLaunch} hours ago
        </p>
        <p className="mt-6 text-xs text-neutral-400">
          bidboard.com.au · Australia’s pay-to-rank leaderboard
        </p>
      </footer>
    </main>
  );
}
