"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AU_NATIONAL,
  AU_STATES,
  CATEGORIES,
  isNationalListing,
  subcategoriesFor,
} from "@/lib/categories";
import { PREVIEW_STORAGE_KEY, type ListingPreview } from "@/lib/listingPreview";

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white";

const pill = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition ${
    active
      ? "bg-indigo-600 text-white"
      : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
  }`;

function locationFromStates(states: string[]): { national: boolean; selected: string[] } {
  if (isNationalListing(states)) return { national: true, selected: [] };
  return {
    national: false,
    selected: states.filter((s) => (AU_STATES as readonly string[]).includes(s)),
  };
}

export function ConfirmListingForm() {
  const [preview, setPreview] = useState<ListingPreview | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [national, setNational] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
      if (!raw) {
        setPreview(null);
        return;
      }
      const data = JSON.parse(raw) as ListingPreview;
      setPreview(data);
      setTitle(data.title || "");
      setCategory(data.confident.category ? data.category : "");
      setSubcategory(data.confident.subcategory && data.subcategory ? data.subcategory : "");
      const loc = locationFromStates(data.states || []);
      setNational(loc.national);
      setSelectedStates(loc.selected);
    } catch {
      setPreview(null);
    }
  }, []);

  const subs = useMemo(() => (category ? subcategoriesFor(category) : []), [category]);

  function onCategoryChange(next: string) {
    setCategory(next);
    const nextSubs = subcategoriesFor(next);
    if (!nextSubs.includes(subcategory)) setSubcategory("");
  }

  function toggleAustralia() {
    if (national) {
      setNational(false);
      return;
    }
    setNational(true);
    setSelectedStates([]);
  }

  function toggleState(code: string) {
    setNational(false);
    setSelectedStates((cur) =>
      cur.includes(code) ? cur.filter((s) => s !== code) : [...cur, code]
    );
  }

  const bidTooLow =
    !!preview?.existing && preview.amountCents <= preview.existing.bidCents;

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) return;
    setError("");

    if (!title.trim()) {
      setError("Please enter a business name before continuing.");
      return;
    }
    if (!category) {
      setError("Please select a category before continuing.");
      return;
    }
    if (!subcategory) {
      setError("Please select a subcategory before continuing.");
      return;
    }
    if (!national && selectedStates.length === 0) {
      setError("Please select a location before continuing.");
      return;
    }
    if (bidTooLow && preview.existing) {
      setError(
        `You must bid at least $1 more than your current bid of $${(preview.existing.bidCents / 100).toFixed(0)}.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: preview.url,
          title: title.trim(),
          description: preview.description || "",
          category,
          subcategory,
          states: national ? [AU_NATIONAL] : selectedStates,
          amountCents: preview.amountCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      if (data.url) {
        try {
          sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
        } catch {
          // ignore
        }
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
      setLoading(false);
    }
  }

  if (preview === undefined) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Check your listing</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Start by entering your website on the homepage.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Bidboard
        </Link>
      </div>
    );
  }

  const showCategoryWarn = !preview.confident.category && !category;
  const showSubWarn = !subcategory;
  const showLocWarn = !national && selectedStates.length === 0;

  return (
    <form
      onSubmit={handleContinue}
      className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Check your listing</h1>
      <p className="mt-2 text-sm text-neutral-600 leading-6 dark:text-neutral-400">
        We found the following information from your website. Check that everything looks right
        before continuing.
      </p>

      {!preview.scraped && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          We couldn't automatically read this website. You can still continue by checking and
          completing the information below.
        </p>
      )}

      {preview.existing && (
        <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Already listed at ${(preview.existing.bidCents / 100).toFixed(0)}. Paying raises your
          position — you only pay the difference.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        {preview.logoUrl ? (
          <img
            src={preview.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-12 w-12 rounded-xl border border-neutral-200 bg-white object-contain dark:border-neutral-700"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Website
          </p>
          <p className="truncate text-sm text-neutral-700 dark:text-neutral-300">{preview.url}</p>
        </div>
      </div>

      <label className="mt-5 block text-sm">
        <span className="mb-1 block text-neutral-500">Business name</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-neutral-500">Category</span>
        {showCategoryWarn && (
          <p className="mb-1.5 text-xs text-amber-700 dark:text-amber-300">
            ⚠ We couldn't confidently determine this
          </p>
        )}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-neutral-500">Subcategory</span>
        {showSubWarn && (
          <p className="mb-1.5 text-xs text-amber-700 dark:text-amber-300">
            Please select a subcategory
          </p>
        )}
        <select
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          disabled={!category}
          className={inputClass}
        >
          <option value="">Please select a subcategory</option>
          {subs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="mb-1 block text-sm text-neutral-500">Location</legend>
        {showLocWarn && (
          <p className="mb-1.5 text-xs text-amber-700 dark:text-amber-300">
            ⚠ We couldn't confidently determine this
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleAustralia} className={pill(national)}>
            Australia
          </button>
          {AU_STATES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleState(code)}
              className={pill(!national && selectedStates.includes(code))}
            >
              {code}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Australia-wide, or the states you serve. No cities or postcodes.
        </p>
      </fieldset>

      <p className="mt-5 text-sm text-neutral-500">
        Something wrong? You can edit the details before continuing.
      </p>

      {bidTooLow && preview.existing && (
        <p className="mt-3 text-sm text-red-600">
          You must bid at least $1 more than your current bid of $
          {(preview.existing.bidCents / 100).toFixed(0)}. Go back and raise the amount.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || bidTooLow}
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Starting payment…" : "Continue to payment →"}
      </button>

      <p className="mt-3 text-center">
        <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-600">
          ← Back
        </Link>
      </p>
    </form>
  );
}
