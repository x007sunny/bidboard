"use client";

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

function getFavicon(url: string, logoUrl: string | null) {
  if (logoUrl) return logoUrl;
  try {
    let domain = url;
    if (domain.startsWith("@")) return null;
    if (!domain.startsWith("http")) domain = `https://${domain}`;
    const host = new URL(domain).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

export function RankingCard({
  rank,
  listing,
}: {
  rank: number;
  listing: Listing;
}) {
  const claimPrice = listing.bidCents + 100;
  const isTop3 = rank <= 3;
  const favicon = getFavicon(listing.url, listing.logoUrl);

  const cardClass = isTop3
    ? `rounded-2xl p-4 mb-3 border ${
        rank === 1
          ? "bg-gradient-to-r from-indigo-100 to-indigo-50 border-indigo-300"
          : rank === 2
          ? "bg-gradient-to-r from-indigo-50 to-slate-50 border-indigo-200"
          : "bg-gradient-to-r from-indigo-50/70 to-white border-indigo-100"
      }`
    : "rounded-2xl border border-neutral-200 bg-white p-4 mb-2 hover:border-neutral-300 transition";

  function goToSite() {
    window.open(`/api/click/${listing.id}`, "_blank", "noopener,noreferrer");
  }

  function onClaim(e: React.MouseEvent) {
    e.stopPropagation();
    const event = new CustomEvent("claim-spot", {
      detail: { amount: claimPrice / 100, rank },
    });
    window.dispatchEvent(event);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      className={`${cardClass} cursor-pointer`}
      id={`listing-${listing.id}`}
      onClick={goToSite}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") goToSite();
      }}
    >
      <div className="flex gap-3 sm:gap-4 items-start">
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
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="h-11 w-11 rounded-xl object-cover border border-black/5 bg-white"
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
              <span className="font-semibold text-black text-[15px] leading-snug">
                {listing.title}
              </span>
              {listing.description && (
                <p className="mt-1 text-sm text-neutral-600 leading-relaxed line-clamp-2">
                  {listing.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className={`text-base font-bold tracking-tight ${isTop3 ? "text-indigo-600" : ""}`}>
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
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {listing.clicks.toLocaleString()} clicks
            </span>
            <button
              type="button"
              onClick={onClaim}
              className="text-indigo-600 hover:text-indigo-700 font-medium underline-offset-2 hover:underline"
            >
              claim for {formatAUD(claimPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
