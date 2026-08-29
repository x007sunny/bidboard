"use client";

import { useState, useMemo, useEffect } from "react";
import { BidForm } from "./BidForm";

type Listing = {
  id: string;
  bidCents: number;
};

export function ClaimBox({
  topBidCents,
  listings,
}: {
  topBidCents: number;
  listings: Listing[];
}) {
  const defaultAmount = Math.max(Math.ceil(topBidCents / 100) + 5, 5);
  const [amount, setAmount] = useState<number | "">(defaultAmount);

  useEffect(() => {
    function onClaim(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.amount) {
        setAmount(detail.amount);
      }
    }
    window.addEventListener("claim-spot", onClaim);
    return () => window.removeEventListener("claim-spot", onClaim);
  }, []);

  const numericAmount = amount === "" ? 0 : amount;

  const predictedRank = useMemo(() => {
    const amountCents = Math.round(numericAmount * 100);
    if (listings.length === 0) return 1;
    if (amountCents < 500) return 1;

    let rank = 1;
    for (const listing of listings) {
      if (amountCents > listing.bidCents) {
        return rank;
      }
      rank++;
    }
    return rank;
  }, [numericAmount, listings]);

  function bump(delta: number) {
    const base = amount === "" ? defaultAmount : amount;
    const next = Math.max(5, base + delta);
    setAmount(next);
  }

  return (
    <section className="mb-5 text-center">
      <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Buy your position. Get seen.
      </h1>
      <p className="mb-3 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed dark:text-neutral-400">
        Australia&apos;s pay-to-rank business leaderboard.
        <br />
        No ads. No subscriptions. Your bid determines your rank.
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
        <span>Claim</span>
        <span className="text-indigo-600">#{predictedRank}</span>
        <span>for</span>

        {/* Amount control with - $input + */}
        <span className="inline-flex items-center gap-1 text-indigo-600">
          <button
            type="button"
            onClick={() => bump(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 text-lg leading-none hover:bg-indigo-50 text-indigo-500 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10"
            aria-label="Decrease bid"
          >
            −
          </button>
          <span className="inline-flex items-baseline">
            <span className="text-indigo-600">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") setAmount("");
                else setAmount(Number(v));
              }}
              className="w-16 bg-transparent text-indigo-600 font-bold text-2xl sm:text-3xl text-center outline-none border-none p-0"
              style={{ border: "none", boxShadow: "none" }}
            />
          </span>
          <button
            type="button"
            onClick={() => bump(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 text-lg leading-none hover:bg-indigo-50 text-indigo-500 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10"
            aria-label="Increase bid"
          >
            +
          </button>
        </span>
      </div>

      <p className="mb-4 text-xs text-neutral-500 max-w-md mx-auto">
        New spots start at $5. Paying less than the #1 price still puts you on the board.
      </p>

      <div className="mx-auto max-w-2xl text-left">
        <BidForm
          defaultAmount={numericAmount || defaultAmount}
          amount={amount}
          onAmountChange={setAmount}
          isTopClaim={predictedRank === 1}
        />
      </div>
    </section>
  );
}
