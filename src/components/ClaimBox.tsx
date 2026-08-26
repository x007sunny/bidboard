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

  return (
    <section className="mb-6 text-center">
      <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Buy your position. Get seen.
      </h1>
      <p className="mb-4 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        Australia&apos;s pay-to-rank business leaderboard.
        <br />
        No ads. No subscriptions. Your bid determines your rank.
      </p>

      {/* Same size as the h1 above */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
        <span>Claim</span>
        <span className="text-indigo-600">#{predictedRank}</span>
        <span>for</span>
        <span className="inline-flex items-center text-indigo-600">
          $
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
            className="w-[5rem] bg-transparent text-indigo-600 font-bold text-2xl sm:text-3xl text-center outline-none border-none"
            style={{ border: "none", boxShadow: "none" }}
          />
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
