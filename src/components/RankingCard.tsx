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

  return (
    <div className="ranking-card group flex gap-4 py-5 transition-colors first:pt-0">
      {/* Rank */}
      <div className="w-8 shrink-0 pt-1 text-right text-sm font-medium text-neutral-400">
        #{rank}
      </div>

      {/* Logo */}
      <div className="shrink-0">
        {listing.logoUrl ? (
          <img
            src={listing.logoUrl}
            alt=""
            className="h-10 w-10 rounded-lg object-cover border border-neutral-100"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-500">
            {listing.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <a
            href={`/api/click/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-black hover:underline"
          >
            {listing.title}
          </a>
          <span className="text-sm font-medium text-neutral-900">
            {formatAUD(listing.bidCents)}
          </span>
        </div>

        {listing.description && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600 leading-relaxed">
            {listing.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span>{timeAgo(listing.lastBidAt)}</span>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">
            {listing.category}
          </span>
          <span>{listing.clicks.toLocaleString()} clicks</span>
        </div>
      </div>

      {/* Claim button */}
      <div className="hidden shrink-0 self-center sm:block">
        <Link
          href={`/?claim=${listing.id}&amount=${claimPrice / 100}`}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 opacity-0 transition-all group-hover:opacity-100 hover:border-neutral-300 hover:bg-neutral-50"
        >
          claim for {formatAUD(claimPrice)}
        </Link>
      </div>
    </div>
  );
}
