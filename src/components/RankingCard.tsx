import Link from "next/link";
import { formatAUD, timeAgo } from "@/lib/ranking";

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
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
  const claimPrice = listing.bidCents + 100; // $1 more

  return (
    <div className="ranking-card group flex gap-4 rounded-lg border border-transparent px-3 py-4 transition-colors hover:border-neutral-200">
      <div className="w-10 shrink-0 pt-1 text-right text-sm font-medium text-neutral-400">
        #{rank}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
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

      <div className="hidden shrink-0 self-center sm:block">
        <Link
          href={`/?claim=${listing.id}&amount=${claimPrice / 100}`}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 opacity-0 transition-opacity group-hover:opacity-100 hover:border-neutral-300 hover:bg-neutral-50"
        >
          claim this rank for {formatAUD(claimPrice)}
        </Link>
      </div>
    </div>
  );
}
