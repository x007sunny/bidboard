"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AU_NATIONAL, AU_STATES, subcategoriesFor } from "@/lib/categories";

const TOP_CATEGORIES = [
  "All",
  "Restaurants",
  "Trades",
  "Auto & Transport",
  "Retail & Shops",
  "Online Shops",
  "Professional Services",
  "Real Estate",
  "Other",
  "Cafes & Coffee",
  "Home Services",
  "Beauty & Wellness",
  "Health & Fitness",
];

function href(opts: {
  category?: string;
  subcategory?: string | null;
  state?: string | null;
}) {
  const p = new URLSearchParams();
  if (opts.category && opts.category !== "All") p.set("category", opts.category);
  if (opts.subcategory) p.set("subcategory", opts.subcategory);
  if (opts.state) p.set("state", opts.state);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

const pill = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition ${
    active
      ? "bg-indigo-600 text-white"
      : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
  }`;

export function BoardFilters({
  category,
  subcategory,
  state,
  categoryCounts,
  subcategoryCounts,
}: {
  category: string;
  subcategory: string;
  state: string;
  categoryCounts: Record<string, number>;
  subcategoryCounts: Record<string, number>;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const cats = TOP_CATEGORIES.filter(
    (c) => c === "All" || (categoryCounts[c] && categoryCounts[c] > 0) || c === category
  );

  const allSubs = subcategoriesFor(category);
  const ranked = useMemo(() => {
    return [...allSubs]
      .filter((s) => s !== "Other")
      .sort((a, b) => (subcategoryCounts[b] || 0) - (subcategoryCounts[a] || 0));
  }, [allSubs, subcategoryCounts]);

  const topFive = ranked.filter((s) => (subcategoryCounts[s] || 0) > 0).slice(0, 5);
  const visible =
    topFive.length > 0
      ? topFive
      : ranked.slice(0, 5);
  const shown = subcategory && !visible.includes(subcategory) ? [subcategory, ...visible].slice(0, 6) : visible;
  const rest = allSubs.filter((s) => !shown.includes(s));

  return (
    <div className="mb-4 space-y-2">
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
          {cats.map((cat) => (
            <Link key={cat} href={href({ category: cat })} className={pill(category === cat)}>
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {category !== "All" && (
        <div className="space-y-2">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1 items-center">
              {shown.map((sub) => (
                <Link
                  key={sub}
                  href={href({
                    category,
                    subcategory: subcategory === sub ? null : sub,
                    state: state || null,
                  })}
                  className={pill(subcategory === sub)}
                >
                  {sub}
                </Link>
              ))}
              {rest.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    className={pill(rest.includes(subcategory))}
                  >
                    More ▾
                  </button>
                  {moreOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-20 cursor-default"
                        aria-label="Close"
                        onClick={() => setMoreOpen(false)}
                      />
                      <div className="absolute left-0 z-30 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          {category} categories
                        </p>
                        {rest.map((sub) => (
                          <Link
                            key={sub}
                            href={href({
                              category,
                              subcategory: sub,
                              state: state || null,
                            })}
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                          >
                            <span>{sub}</span>
                            {subcategoryCounts[sub] ? (
                              <span className="text-[11px] text-neutral-400">
                                {subcategoryCounts[sub]}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Location
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
              <Link
                href={href({
                  category,
                  subcategory: subcategory || null,
                  state: state === AU_NATIONAL ? null : AU_NATIONAL,
                })}
                className={pill(state === AU_NATIONAL)}
              >
                Australia
              </Link>
              {AU_STATES.map((code) => (
                <Link
                  key={code}
                  href={href({
                    category,
                    subcategory: subcategory || null,
                    state: state === code ? null : code,
                  })}
                  className={pill(state === code)}
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
