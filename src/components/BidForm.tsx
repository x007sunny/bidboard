"use client";

import { useState, useEffect } from "react";

export function BidForm({
  defaultAmount = 5,
  isTopClaim = false,
  existingUrl = "",
  onAmountChange,
}: {
  defaultAmount?: number;
  isTopClaim?: boolean;
  existingUrl?: string;
  onAmountChange?: (n: number) => void;
}) {
  const [url, setUrl] = useState(existingUrl);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [logoUrl, setLogoUrl] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setAmount(defaultAmount);
  }, [defaultAmount]);

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
    "Trades",
    "Real Estate",
    "Other",
  ];

  function updateAmount(n: number) {
    setAmount(n);
    onAmountChange?.(n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Auto-fetch favicon if no logo provided and it's a website
      let finalLogo = logoUrl.trim() || null;
      if (!finalLogo && url && !url.trim().startsWith("@")) {
        try {
          let domain = url.trim();
          if (!domain.startsWith("http")) domain = `https://${domain}`;
          const host = new URL(domain).hostname.replace(/^www\./, "");
          finalLogo = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
        } catch {
          // ignore
        }
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          description: description.trim() || url.trim(),
          category,
          logoUrl: finalLogo,
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

  const isRaise = existingUrl || false;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Your website or @handle"
          className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black sm:w-44 bg-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? "…" : isTopClaim ? "Get on the board" : "Get on the board"}
        </button>
      </div>

      <p className="text-xs text-neutral-500">
        Already listed? Enter the same URL or @handle to raise your position.
      </p>

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="text-xs text-neutral-500 hover:text-black"
      >
        {showMore ? "Hide extra fields" : "+ Add description & custom logo"}
      </button>

      {showMore && (
        <div className="space-y-3 pt-1">
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            maxLength={280}
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black bg-white"
          />
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Custom logo URL (optional – we auto-fetch favicon)"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-black bg-white"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
