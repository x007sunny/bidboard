import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia", // use latest stable if this fails
  typescript: true,
});

export const MIN_BID_CENTS = 500; // $5.00 AUD
export const MAX_BID_CENTS = 999_999_00; // $999,999 AUD
export const INCREMENT_CENTS = 100; // $1
export const TOP_OUTBID_EXTRA_CENTS = 500; // $5 extra to take #1
