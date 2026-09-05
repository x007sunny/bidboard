"use client";

import { useState, useEffect, useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { parseSocialUrl, socialAvatarSrc } from "@/lib/social";

function extractHost(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.startsWith("@")) return null;
  try {
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname.replace(/^www\./, "");
    if (!host.includes(".") || host.length < 3) return null;
    return host;
  } catch {
    return null;
  }
}

function previewIcon(input: string): string | null {
  const social = socialAvatarSrc(input);
  if (social) return social;
  const h = extractHost(input);
  return h ? `https://www.google.com/s2/favicons?domain=${h}&sz=64` : null;
}

export function BidForm({
  defaultAmount = 5,
  amount: controlledAmount,
  existingUrl = "",
}: {
  defaultAmount?: number;
  amount?: number | "";
  onAmountChange?: (n: number | "") => void;
  isTopClaim?: boolean;
  existingUrl?: string;
}) {
  const [url, setUrl] = useState(existingUrl);
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState<number | "">(controlledAmount ?? defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (controlledAmount !== undefined) {
      setAmount(controlledAmount);
    }
  }, [controlledAmount]);

  const liveFavicon = useMemo(() => previewIcon(url), [url]);

  const numericAmount = amount === "" ? 0 : amount;
  const underMin = numericAmount > 0 && numericAmount < 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (url.trim().startsWith("@")) {
      setError("Please enter a website, Facebook, or Instagram URL — not an @handle.");
      return;
    }

    if (!extractHost(url)) {
      setError("Please enter a website like yourproduct.com, facebook.com/page or instagram.com/page");
      return;
    }

    const host = extractHost(url);
    if (host && /^(facebook|fb|instagram)\.com$/i.test(host) && !parseSocialUrl(url)) {
      setError("Paste the full page URL, e.g. facebook.com/yourpage or instagram.com/yourpage");
      return;
    }

    if (numericAmount < 5) {
      setError("Pay at least $5 to claim a spot.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          category,
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
        <div className="relative flex-1">
          {liveFavicon ? (
            <img
              src={liveFavicon}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-sm bg-white"
            />
          ) : (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            </span>
          )}
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="website, facebook, instagram"
            className="w-full rounded-xl border border-neutral-300 py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white placeholder:text-neutral-300 dark:bg-neutral-950 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-600"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600 sm:w-32 bg-white dark:bg-neutral-950 dark:border-neutral-700 dark:text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? "…" : "Get on the board"}
        </button>
      </div>

      {underMin && (
        <p className="text-sm text-red-600">Pay at least $5 to claim a spot.</p>
      )}
      {error && !underMin && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-neutral-500">
        Already listed? Enter the same URL to raise your position.
      </p>
    </form>
  );
}
