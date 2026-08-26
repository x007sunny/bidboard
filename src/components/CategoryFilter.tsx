"use client";

import { useState } from "react";
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

// Show these first on mobile; rest go in "More"
const PRIMARY = ["All", "Restaurants", "Retail & Shops", "Professional Services"];

export function CategoryFilter({
  current,
  counts,
}: {
  current: string;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const cats = ORDER.filter((c) => c === "All" || (counts[c] && counts[c] > 0));
  const primary = cats.filter((c) => PRIMARY.includes(c));
  const more = cats.filter((c) => !PRIMARY.includes(c));
  const currentInMore = more.includes(current);

  return (
    <div className="mb-4">
      {/* Desktop: all chips */}
      <div className="hidden sm:flex gap-2 flex-wrap">
        {cats.map((cat) => {
          const active = current === cat;
          return (
            <Link
              key={cat}
              href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
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

      {/* Mobile: primary + More dropdown */}
      <div className="flex sm:hidden items-center gap-2 flex-wrap">
        {primary.map((cat) => {
          const active = current === cat;
          return (
            <Link
              key={cat}
              href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-600"
              }`}
            >
              {cat}
            </Link>
          );
        })}

        {more.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                currentInMore
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-neutral-200 text-neutral-600"
              }`}
            >
              {currentInMore ? current : "More"} ▾
            </button>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  {more.map((cat) => (
                    <Link
                      key={cat}
                      href={`/?category=${encodeURIComponent(cat)}`}
                      onClick={() => setOpen(false)}
                      className={`block px-3.5 py-2 text-xs hover:bg-neutral-50 ${
                        current === cat ? "font-semibold text-indigo-600" : "text-neutral-700"
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
