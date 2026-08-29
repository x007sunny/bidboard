"use client";

import { useState } from "react";
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

function googleFavicon(url: string) {
  try {
    let domain = url;
    if (!domain.startsWith("http")) domain = `https://${domain}`;
    const host = new URL(domain).hostname.replace(/^www\./, "");
    if (!host.includes(".")) return null;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

function listingHost(url: string) {
  try {
    let domain = url;
    if (!domain.startsWith("http")) domain = `https://${domain}`;
    return new URL(domain).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function duckDuckGoIcon(url: string) {
  try {
    let domain = url;
    if (!domain.startsWith("http")) domain = `https://${domain}`;
    const host = new URL(domain).hostname.replace(/^www\./, "");
    if (!host.includes(".")) return null;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return null;
  }
}

function CrownBadge({ rank }: { rank: 1 | 2 | 3 }) {
  const fill = rank === 1 ? "#f5c518" : rank === 2 ? "#c5cdd6" : "#d08a4c";
  const crown = rank === 1 ? "#fff8dc" : rank === 2 ? "#ffffff" : "#fff1e0";

  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-[#0f0f12]"
      style={{ background: fill }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M4.5 16.5 7 8.5l5 4.5 5-4.5 2.5 8H4.5Z" fill={crown} />
        <path d="M5 18.2h14v1.6H5z" fill={crown} />
        <circle cx="7" cy="8.2" r="1.35" fill={crown} />
        <circle cx="12" cy="6.4" r="1.45" fill={crown} />
        <circle cx="17" cy="8.2" r="1.35" fill={crown} />
      </svg>
    </span>
  );
}

const CARD_BY_RANK: Record<number, string> = {
  1: "rounded-2xl p-4 border-2 border-[#e4b81a] bg-gradient-to-r from-[#fff4c4] to-[#fffbeb] dark:from-[#3a3008] dark:to-[#1c1808] dark:border-[#e4b81a]",
  2: "rounded-2xl p-4 border-2 border-[#b8c0c8] bg-gradient-to-r from-[#eef1f4] to-[#f8fafc] dark:from-[#2a2e33] dark:to-[#17191c] dark:border-[#9aa3ad]",
  3: "rounded-2xl p-4 border-2 border-[#c67b3e] bg-gradient-to-r from-[#f6dfc8] to-[#fdf6ee] dark:from-[#3a2414] dark:to-[#1c140c] dark:border-[#c67b3e]",
};

const PRICE_BY_RANK: Record<number, string> = {
  1: "text-[#b8860b] dark:text-[#f5c518]",
  2: "text-slate-600 dark:text-slate-300",
  3: "text-[#b45309] dark:text-[#e0a06a]",
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
  const fallbackIcon = googleFavicon(listing.url);
  const extraFallback = duckDuckGoIcon(listing.url);
  const [imgSrc, setImgSrc] = useState<string | null>(listing.logoUrl || fallbackIcon);

  const cardClass = isTop3
    ? CARD_BY_RANK[rank]
    : "rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500";

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
    <div className={isTop3 ? "relative mb-2 pt-3" : "mb-2"}>
      {isTop3 && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <CrownBadge rank={rank as 1 | 2 | 3} />
        </div>
      )}
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
          <div className="flex shrink-0 flex-col items-center gap-1.5 sm:flex-row sm:items-start sm:gap-3">
            <div className="pt-0.5">
              {isTop3 ? (
                <span className={`rank-badge rank-badge-${rank}`}>#{rank}</span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center text-sm font-medium text-neutral-400">
                  #{rank}
                </span>
              )}
            </div>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt=""
                className="h-11 w-11 rounded-xl object-contain border border-black/5 bg-white dark:border-white/10"
                onError={() => {
                  if (fallbackIcon && imgSrc !== fallbackIcon) {
                    setImgSrc(fallbackIcon);
                  } else if (extraFallback && imgSrc !== extraFallback) {
                    setImgSrc(extraFallback);
                  } else {
                    setImgSrc(null);
                  }
                }}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-base font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
                {listing.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-semibold text-black text-[15px] leading-snug dark:text-white">
                {listing.title}
              </span>
              <div
                className={`shrink-0 text-base font-bold tracking-tight ${
                  PRICE_BY_RANK[rank] || "dark:text-white"
                }`}
              >
                {formatAUD(listing.bidCents)}
              </div>
            </div>
            {listing.description && (
              <p
                className={`mt-1 text-sm text-neutral-600 dark:text-neutral-300 ${
                  isTop3 ? "line-clamp-2" : "truncate"
                }`}
              >
                {listing.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{listing.category}</span>
              <span className="text-neutral-300">·</span>
              <span>{timeAgo(listing.lastBidAt)}</span>
              <span className="text-neutral-300">·</span>
              <span className="truncate">{listingHost(listing.url)}</span>
              <span className="text-neutral-300">·</span>
              <span>{listing.clicks.toLocaleString()} clicks</span>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={onClaim}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
              >
                Claim for {formatAUD(claimPrice)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
