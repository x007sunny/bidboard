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
  const [amount, setAmount] = useState(defaultAmount);

  // Listen for "claim for $X" clicks from cards
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

  const predictedRank = useMemo(() => {
    const amountCents = Math.round(amount * 100);
    if (listings.length === 0) return 1;

    let rank = 1;
    for (const listing of listings) {
      if (amountCents > listing.bidCents) {
        return rank;
      }
      rank++;
    }
    return rank;
  }, [amount, listings]);

  return (
    <section className="mb-7 text-center">
      <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Buy your position. Get seen.
      </h1>
      <p className="mb-5 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        Australia&apos;s pay-to-rank business leaderboard.
        <br />
        No ads. No subscriptions. Your bid determines your rank.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-xl sm:text-2xl font-bold tracking-tight">
        <span>Claim</span>
        <span className="text-orange-500">#{predictedRank}</span>
        <span>for</span>
        <span className="inline-flex items-center text-orange-500">
          $
          <input
            type="number"
            min={5}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 5)}
            className="w-[4.5rem] bg-transparent border-b-2 border-orange-300 text-orange-500 font-bold text-xl sm:text-2xl text-center outline-none focus:border-orange-500"
          />
        </span>
      </div>

      <p className="mb-5 text-xs text-neutral-500 max-w-md mx-auto">
        New spots start at $5. Paying less than the #1 price still puts you on the board.
      </p>

      <div className="mx-auto max-w-2xl text-left">
        <BidForm
          defaultAmount={amount}
          isTopClaim={predictedRank === 1}
          onAmountChange={setAmount}
        />
      </div>
    </section>
  );
}
