import Link from "next/link";
import {
  getBidLadder,
  getCategoryCounts,
  getLeaderboard,
  getSubcategoryCounts,
} from "@/lib/ranking";
import { RankingCard } from "@/components/RankingCard";
import { ActivityTicker } from "@/components/ActivityTicker";
import { ClaimBox } from "@/components/ClaimBox";
import { BoardFilters } from "@/components/BoardFilters";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getVisitorStats } from "@/lib/visitors";
import { ensureTaxonomy } from "@/lib/taxonomy";
import { logTiming, timeit } from "@/lib/timing";

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

  const filter = { category, subcategory: subcategory || undefined, state: state || undefined };

  const timings: Record<string, number> = {};
  const t0 = Date.now();

  const [
    { listings, total },
    bidList,
    categoryCounts,
    subcategoryCounts,
    visitorStats,
    taxonomy,
  ] = await Promise.all([
    timeit("leaderboard", () => getLeaderboard(50, page, filter), timings),
    timeit("bidLadder", () => getBidLadder(), timings),
    timeit("categoryCounts", () => getCategoryCounts(), timings),
    timeit("subcategoryCounts", () => getSubcategoryCounts(category, state || undefined), timings),
    timeit("visitors", () => getVisitorStats(), timings),
    timeit("taxonomy", () => ensureTaxonomy(), timings),
  ]);

  const parallelMs = Date.now() - t0;
  const topBid = bidList[0]?.bidCents ?? 0;
  const { totalVisitors, onlineNow } = visitorStats;
  const start = (page - 1) * 50;
  const currentSubs = taxonomy.find((t) => t.name === category)?.subcategories || [];

  logTiming({
    filter,
    listingCount: listings.length,
    bidLadderCount: bidList.length,
    parallelMs,
    timings,
    wallMs: Date.now() - t0,
  });

  return (
    <main>
      <SiteHeader onlineNow={onlineNow} totalVisitors={totalVisitors} />

      <BoardFilters
        category={category}
        subcategory={subcategory}
        state={state}
        categoryCounts={categoryCounts}
        subcategoryCounts={subcategoryCounts}
        categoryNames={taxonomy.map((t) => t.name)}
        subcategories={currentSubs}
      />

      <ClaimBox topBidCents={topBid} listings={bidList} />

      <ActivityTicker />

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
                  <RankingCard rank={rank} listing={listing} />
                  {rank === 3 && listings.length > 3 && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                      <span className="rounded-full border border-neutral-200 bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
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

      <SiteFooter />
    </main>
  );
}
