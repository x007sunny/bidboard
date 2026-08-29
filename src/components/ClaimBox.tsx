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
    <section className="mb-5 grid items-center gap-6 md:grid-cols-2 md:gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-[1.15]">
          Buy your position.
          <br />
          <span className="text-indigo-600">Get seen.</span>
        </h1>
        <p className="mt-3 text-sm text-neutral-600 max-w-sm leading-relaxed dark:text-neutral-400">
          Australia's pay-to-rank business leaderboard.
          <br />
          No ads. No subscriptions. Your bid determines your rank.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight">
          <span>Claim</span>
          <span className="text-indigo-600">#{predictedRank}</span>
          <span>for</span>
          <span className="inline-flex items-center gap-1 text-indigo-600">
            <button
              type="button"
              onClick={() => bump(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-200 text-lg leading-none hover:bg-indigo-50 text-indigo-500 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10"
              aria-label="Decrease bid"
            >
              −
            </button>
            <span className="inline-flex items-baseline">
              <span>$</span>
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
                className="w-14 bg-transparent text-indigo-600 font-bold text-xl sm:text-2xl text-center outline-none border-none p-0"
                style={{ border: "none", boxShadow: "none" }}
              />
            </span>
            <button
              type="button"
              onClick={() => bump(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-200 text-lg leading-none hover:bg-indigo-50 text-indigo-500 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10"
              aria-label="Increase bid"
            >
              +
            </button>
          </span>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          New spots start at $5.
          <br />
          Paying less than the #1 price still puts you on the board.
        </p>
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
