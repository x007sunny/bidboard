import Link from "next/link";
import { getLeaderboard, getTopBidCents } from "@/lib/ranking";
import { RankingCard } from "@/components/RankingCard";
import { ActivityTicker } from "@/components/ActivityTicker";
import { ClaimBox } from "@/components/ClaimBox";
import { BoardFilters } from "@/components/BoardFilters";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getVisitorStats } from "@/lib/visitors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; subcategory?: string; state?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const category = params.category || "All";
  const subcategory = params.subcategory || "";
  const state = (params.state || "").toUpperCase();

  const { listings: allListings, total: allTotal } = await getLeaderboard(200, 1);
  const topBid = await getTopBidCents();

  // Filter by category if needed
  const filtered = allListings.filter((l) => {
    if (category !== "All" && l.category !== category) return false;
    if (subcategory && l.subcategory !== subcategory) return false;
    if (state) {
      const states = l.states || [];
      if (!states.includes(state)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * 50;
  const listings = filtered.slice(start, start + 50);

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: "completed" },
    _sum: { amountCents: true },
  });
  const revenueCents = totalRevenue._sum.amountCents || 0;

  const launchDate = new Date("2026-08-23T00:00:00Z");
  const hoursSinceLaunch = Math.floor(
    (Date.now() - launchDate.getTime()) / (1000 * 60 * 60)
  );
  const { totalVisitors, onlineNow } = await getVisitorStats();

  const bidList = allListings.map((l) => ({ id: l.id, bidCents: l.bidCents }));

  // Category counts for the filter
  const categoryCounts: Record<string, number> = { All: allListings.length };
  for (const l of allListings) {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
  }
  const subcategoryCounts: Record<string, number> = {};
  for (const l of allListings) {
    if (l.category !== category || !l.subcategory) continue;
    subcategoryCounts[l.subcategory] = (subcategoryCounts[l.subcategory] || 0) + 1;
  }

  return (
    <main>
      <SiteHeader onlineNow={onlineNow} totalVisitors={totalVisitors} />

      <ClaimBox topBidCents={topBid} listings={bidList} />

      <BoardFilters
        category={category}
        subcategory={subcategory}
        state={state}
        categoryCounts={categoryCounts}
        subcategoryCounts={subcategoryCounts}
      />

      <ActivityTicker />

      {/* Leaderboard */}
      <section className="mt-5">
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 py-14 text-center text-neutral-500 text-sm">
            No listings in this category yet.
          </div>
        ) : (
          <div>
            {listings.map((listing, index) => {
              const rank = start + index + 1;
              return (
                <div key={listing.id}>
                  <RankingCard
                    rank={rank}
                    listing={listing}
                  />
                  {rank === 3 && listings.length > 3 && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                      <span className="rounded-full border border-neutral-200 bg-white px-3 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase dark:border-neutral-700 dark:bg-neutral-900">
                        Top 3
                      </span>
                      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {total > 50 && (
          <div className="mt-8 flex justify-center gap-6 text-sm">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}${category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}${subcategory ? `&subcategory=${encodeURIComponent(subcategory)}` : ""}${state ? `&state=${encodeURIComponent(state)}` : ""}`}
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
                href={`/?page=${page + 1}${category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}${subcategory ? `&subcategory=${encodeURIComponent(subcategory)}` : ""}${state ? `&state=${encodeURIComponent(state)}` : ""}`}
                className="text-neutral-600 hover:text-black"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      <SiteFooter revenueCents={revenueCents} hoursSinceLaunch={hoursSinceLaunch} />
    </main>
  );
}
