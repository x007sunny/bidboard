"use client";

import { useState, useMemo } from "react";
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
    <section className="mb-8 text-center">
      <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl flex flex-wrap items-center justify-center gap-1.5">
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
            className="w-20 bg-transparent border-b-2 border-orange-300 text-orange-500 font-bold text-2xl sm:text-3xl text-center outline-none focus:border-orange-500 mx-0.5"
          />
        </span>
      </h1>
      <p className="mb-5 text-sm text-neutral-500 max-w-lg mx-auto">
        New spots start at $5. Paying less than the #1 price still puts you on
        the board at whatever place that bid can take.
      </p>

      <div className="mx-auto max-w-2xl">
        <BidForm defaultAmount={amount} isTopClaim={predictedRank === 1} />
      </div>
    </section>
  );
}
