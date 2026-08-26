"use client";

import { useState, useRef, useEffect } from "react";
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cats = ORDER.filter((c) => c === "All" || (counts[c] && counts[c] > 0));
  const mobilePrimary = [
    ...cats.filter((c) => c === "All"),
    ...cats.filter((c) => c !== "All").slice(0, 2),
  ];
  const more = cats.filter((c) => !mobilePrimary.includes(c));
  const currentInMore = more.includes(current);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="mb-4">
      {/* Desktop */}
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

      {/* Mobile: single row */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
        {mobilePrimary.map((cat) => {
          const active = current === cat;
          return (
            <Link
              key={cat}
              href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition ${
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
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap transition ${
                currentInMore
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-neutral-200 text-neutral-600"
              }`}
            >
              {currentInMore ? current : "More"} ▾
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto">
                {more.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                    onClick={() => setOpen(false)}
                    className={`block px-3.5 py-2.5 text-xs hover:bg-neutral-50 ${
                      current === cat ? "font-semibold text-indigo-600" : "text-neutral-700"
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
