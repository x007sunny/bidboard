"use client";

import { useState, useEffect } from "react";

export function BidForm({
  defaultAmount = 5,
  amount: controlledAmount,
  onAmountChange,
  isTopClaim = false,
  existingUrl = "",
}: {
  defaultAmount?: number;
  amount?: number | "";
  onAmountChange?: (n: number | "") => void;
  isTopClaim?: boolean;
  existingUrl?: string;
}) {
  const [url, setUrl] = useState(existingUrl);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState<number | "">(controlledAmount ?? defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (controlledAmount !== undefined) {
      setAmount(controlledAmount);
    }
  }, [controlledAmount]);

  const categories = [
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

  const numericAmount = amount === "" ? 0 : amount;
  const underMin = numericAmount > 0 && numericAmount < 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (numericAmount < 5) {
      setError("Pay at least $5 to claim a spot.");
      return;
    }

    setLoading(true);

    try {
      let finalLogo: string | null = null;
      if (url && !url.trim().startsWith("@")) {
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
          amountCents: Math.round(numericAmount * 100),
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
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Your website or @handle"
          className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600 sm:w-44 bg-white"
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
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? "…" : "Get on the board"}
        </button>
      </div>

      {underMin && (
        <p className="text-sm text-red-600">Pay at least $5 to claim a spot.</p>
      )}
      {error && !underMin && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span>Already listed? Enter the same URL or @handle to raise your position.</span>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-neutral-500 hover:text-black shrink-0"
        >
          {showMore ? "Hide description" : "+ Add description"}
        </button>
      </div>

      {showMore && (
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          maxLength={280}
          className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 bg-white"
        />
      )}
    </form>
  );
}
