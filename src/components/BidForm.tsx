"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BidForm({
  defaultAmount = 5,
  isTopClaim = false,
  existingUrl = "",
}: {
  defaultAmount?: number;
  isTopClaim?: boolean;
  existingUrl?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(existingUrl);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Restaurants");
  const [amount, setAmount] = useState(defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          description: description.trim(),
          category,
          amountCents: Math.round(amount * 100),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Redirect to Stripe Checkout
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Website or @handle
        </label>
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com.au or @yourbusiness"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Already on the list? Enter the same URL or @handle and up your bid.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Short description
        </label>
        <textarea
          required
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does your business do?"
          maxLength={280}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Your bid (AUD)
          </label>
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
              className="w-full rounded-lg border border-neutral-300 py-2 pl-7 pr-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? "Redirecting to Stripe…" : isTopClaim ? "Outbid for #1" : "Place bid"}
      </button>
    </form>
  );
}
