import Link from "next/link";
import {
  getCategoryCounts,
  getLeaderboard,
  getSubcategoryCounts,
} from "@/lib/ranking";
import { RankingCard } from "@/components/RankingCard";
import { BoardFilters } from "@/components/BoardFilters";
import { BoardToggle } from "@/components/BoardToggle";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getVisitorStats } from "@/lib/visitors";
import { ensureTaxonomy } from "@/lib/taxonomy";
import {
  getFoundingArchive,
  getFoundingCategoryCounts,
  getFoundingSubcategoryCounts,
  ensureFoundingState,
} from "@/lib/founding";
import { boardHref } from "@/lib/boardHref";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FoundingPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    subcategory?: string;
    state?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const category = params.category || "All";
  const subcategory = params.subcategory || "";
  const state = (params.state || "").toUpperCase();
  const filter = { category, subcategory: subcategory || undefined, state: state || undefined };

  const { locked } = await ensureFoundingState();
  const showArchive = locked;

  const [
    liveBoard,
    archive,
    liveCategoryCounts,
    archiveCategoryCounts,
    liveSubCounts,
    archiveSubCounts,
    visitorStats,
    taxonomy,
  ] = await Promise.all([
    showArchive
      ? Promise.resolve({ listings: [], total: 0, page, limit: 50 })
      : getLeaderboard(50, page, filter),
    showArchive ? getFoundingArchive(50, page, filter) : Promise.resolve({ listings: [], total: 0 }),
    showArchive ? Promise.resolve({} as Record<string, number>) : getCategoryCounts(),
    showArchive ? getFoundingCategoryCounts() : Promise.resolve({} as Record<string, number>),
    showArchive
      ? Promise.resolve({} as Record<string, number>)
      : getSubcategoryCounts(category, state || undefined),
    showArchive
      ? getFoundingSubcategoryCounts(category, state || undefined)
      : Promise.resolve({} as Record<string, number>),
    getVisitorStats(),
    ensureTaxonomy(),
  ]);

  const { totalVisitors, onlineNow } = visitorStats;
  const start = (page - 1) * 50;
  const currentSubs = taxonomy.find((t) => t.name === category)?.subcategories || [];
  const listings = showArchive ? archive.listings : liveBoard.listings;
  const total = showArchive ? archive.total : liveBoard.total;
  const categoryCounts = showArchive ? archiveCategoryCounts : liveCategoryCounts;
  const subcategoryCounts = showArchive ? archiveSubCounts : liveSubCounts;

  return (
    <main>
      <SiteHeader />

      <BoardFilters
        category={category}
        subcategory={subcategory}
        state={state}
        categoryCounts={categoryCounts}
        subcategoryCounts={subcategoryCounts}
        categoryNames={taxonomy.map((t) => t.name)}
        subcategories={currentSubs}
        basePath="/founding"
      />

      <BoardToggle
        board="founding"
        locked={locked}
        category={category}
        subcategory={subcategory}
        state={state}
        basePath="/founding"
      />

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">The Founding 50</h1>
        <p className="mt-2 text-sm text-neutral-500">
          The first 50 businesses to join Bidboard.
        </p>
        {locked && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Founding 50 — Locked
          </p>
        )}
      </div>

      <section>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 py-14 text-center text-neutral-500 text-sm">
            {locked
              ? "No founding businesses in this category."
              : "No listings in this category yet."}
          </div>
        ) : (
          <div>
            {listings.map((listing, index) => {
              const rank = showArchive
                ? "foundingRank" in listing
                  ? listing.foundingRank
                  : start + index + 1
                : start + index + 1;
              return (
                <div key={listing.id}>
                  <RankingCard
                    rank={rank}
                    listing={listing}
                    showClaim={!showArchive}
                    trackClicks={!showArchive || Boolean("liveListingId" in listing && listing.liveListingId)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {total > 50 && (
          <div className="mt-8 flex justify-center gap-6 text-sm">
            {page > 1 && (
              <Link
                href={boardHref({
                  basePath: "/founding",
                  category,
                  subcategory: subcategory || null,
                  state: state || null,
                  page: page - 1,
                })}
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
                href={boardHref({
                  basePath: "/founding",
                  category,
                  subcategory: subcategory || null,
                  state: state || null,
                  page: page + 1,
                })}
                className="text-neutral-600 hover:text-black"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      <SiteFooter onlineNow={onlineNow} totalVisitors={totalVisitors} />
    </main>
  );
}
