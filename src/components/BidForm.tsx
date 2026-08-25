"use client";

import { useState } from "react";

export function BidForm({
  defaultAmount = 5,
  isTopClaim = false,
  existingUrl = "",
}: {
  defaultAmount?: number;
  isTopClaim?: boolean;
  existingUrl?: string;
}) {
  const [url, setUrl] = useState(existingUrl);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [logoUrl, setLogoUrl] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  const categories = [
    "Restaurants",
    "Cafes & Coffee",
    "Home Services",
    "Beauty & Wellness",
    "Auto & Transport",
    "Retail & Shops",
    "Online Shops",
    "Professional Services",
    "Health & Fitness",
    "Other",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          description: description.trim() || url.trim(),
          category,
          logoUrl: logoUrl.trim() || null,
          amountCents: Math.round(amount * 100),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main compact row like outbid */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Your product URL or @handle"
          className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black sm:w-40"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
              $
            </span>
            <input
              type="number"
              required
              min={5}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 rounded-xl border border-neutral-300 py-2.5 pl-7 pr-2 text-sm outline-none focus:border-black"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? "…" : "Outbid"}
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Already on the list? Enter the same URL or @handle and up your bid.
      </p>

      {/* Optional fields collapsed */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="text-xs text-neutral-500 hover:text-black"
      >
        {showMore ? "Hide extra fields" : "+ Add description & logo"}
      </button>

      {showMore && (
        <div className="space-y-3 pt-1">
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            maxLength={280}
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black"
          />
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo URL (optional)"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
