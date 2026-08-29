"use client";

import { saveListing } from "@/app/admin/actions";

import { CATEGORIES } from "@/lib/categories";

type Listing = {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  logoUrl: string | null;
  bidCents: number;
  clicks: number;
};

export function AdminListingForm({
  listing,
  error,
}: {
  listing?: Listing;
  error?: string;
}) {
  return (
    <form action={saveListing} className="space-y-4">
      {listing && <input type="hidden" name="id" value={listing.id} />}
      {error === "1" && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Title and URL are required.</p>
      )}
      {error === "2" && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not save. That URL may already be listed.
        </p>
      )}

      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">Title</span>
        <input
          name="title"
          required
          defaultValue={listing?.title || ""}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">Website URL</span>
        <input
          name="url"
          required
          defaultValue={listing?.url || ""}
          placeholder="https://example.com.au"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={listing?.description || ""}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">Category</span>
        <select
          name="category"
          defaultValue={listing?.category || "Other"}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">Logo URL</span>
        <input
          name="logoUrl"
          defaultValue={listing?.logoUrl || ""}
          placeholder="https://…"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">Bid (AUD)</span>
          <input
            name="bid"
            type="number"
            min={0}
            step="1"
            defaultValue={listing ? Math.round(listing.bidCents / 100) : 5}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">Clicks</span>
          <input
            name="clicks"
            type="number"
            min={0}
            step="1"
            defaultValue={listing?.clicks ?? 0}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {listing ? "Save changes" : "Add listing"}
      </button>
    </form>
  );
}
