import Link from "next/link";
import { formatAUD, timeAgo } from "@/lib/ranking";

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  logoUrl: string | null;
  bidCents: number;
  clicks: number;
  lastBidAt: Date;
  url: string;
};

export function RankingCard({
  rank,
  listing,
}: {
  rank: number;
  listing: Listing;
}) {
  const claimPrice = listing.bidCents + 100;
  const isTop3 = rank <= 3;

  const cardClass = isTop3
    ? `rank-${rank} rounded-2xl p-4 mb-3`
    : "rounded-xl border border-neutral-200 bg-white p-4 mb-2 hover:border-neutral-300 transition";

  return (
    <div className={cardClass}>
      <div className="flex gap-3 sm:gap-4">
        <div className="shrink-0 pt-0.5">
          {isTop3 ? (
            <span className={`rank-badge rank-badge-${rank}`}>#{rank}</span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center text-sm font-medium text-neutral-400">
              #{rank}
            </span>
          )}
        </div>

        <div className="shrink-0">
          {listing.logoUrl ? (
            <img
              src={listing.logoUrl}
              alt=""
              className="h-11 w-11 rounded-xl object-cover border border-black/5"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-base font-semibold text-neutral-500">
              {listing.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={`/api/click/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-black hover:underline text-[15px] leading-snug"
              >
                {listing.title}
              </a>
              {listing.description && (
                <p className="mt-1 text-sm text-neutral-600 leading-relaxed line-clamp-2">
                  {listing.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold tracking-tight">
                {formatAUD(listing.bidCents)}
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span>{timeAgo(listing.lastBidAt)}</span>
            <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-neutral-600">
              {listing.category}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              {listing.clicks.toLocaleString()} clicks
            </span>
            <Link
              href={`/?claim=${listing.id}&amount=${claimPrice / 100}`}
              className="text-neutral-500 hover:text-black underline-offset-2 hover:underline"
            >
              claim for {formatAUD(claimPrice)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
