"use client";

import Link from "next/link";

const ORDER = [
  "All",
  "Restaurants",
  "Cafes & Coffee",
  "Home Services",
  "Trades",
  "Beauty & Wellness",
  "Auto & Transport",
  "Retail & Shops",
  "Online Shops",
  "Professional Services",
  "Health & Fitness",
  "Real Estate",
  "Other",
];

export function CategoryFilter({
  current,
  counts,
}: {
  current: string;
  counts: Record<string, number>;
}) {
  const cats = ORDER.filter((c) => c === "All" || (counts[c] && counts[c] > 0));

  return (
    <div className="mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
        {cats.map((cat) => {
          const active = current === cat;
          return (
            <Link
              key={cat}
              href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
