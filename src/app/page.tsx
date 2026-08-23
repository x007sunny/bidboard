import Link from "next/link";
import { getLeaderboard, formatAUD, getTopBidCents } from "@/lib/ranking";
import { BidForm } from "@/components/BidForm";
import { RankingCard } from "@/components/RankingCard";
import { ActivityFeed } from "@/components/ActivityFeed";

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
  const claimTopPrice = Math.max(topBid + 500, 500); // $5 more than top or $5 min

  return (
    <main>
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            bidboard<span className="text-neutral-400">.com.au</span>
          </Link>
          <div className="flex gap-4 text-sm text-neutral-500">
            <Link href="/rules" className="hover:text-black">
              Rules
            </Link>
            <Link href="/about" className="hover:text-black">
              About
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Claim #1 */}
      <section className="mb-12">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Outbid your competition
        </h1>
        <p className="mb-6 text-neutral-600">
          No ads, no API keys, no revenue sharing.
          <br />
          Just outbid other Australian businesses to get to the top.
        </p>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Claim #1</h2>
            <span className="text-2xl font-bold">{formatAUD(claimTopPrice)}</span>
          </div>
          <p className="mb-4 text-sm text-neutral-600">
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
        <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-500">
            No listings yet. Be the first to claim a spot.
          </div>
        ) : (
          <div className="space-y-1">
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

        {/* Simple pagination */}
        {total > 50 && (
          <div className="mt-8 flex justify-center gap-4 text-sm">
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

      <footer className="mt-16 border-t border-neutral-100 pt-6 text-center text-xs text-neutral-400">
        bidboard.com.au · Australia’s pay-to-rank leaderboard
      </footer>
    </main>
  );
}
