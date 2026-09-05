import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Keep the live API version. Stripe's 17.7 types only list the latest string.
  apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});

export const MIN_BID_CENTS = 500;
export const MAX_BID_CENTS = 999_999_00;
export const TOP_OUTBID_EXTRA_CENTS = 500;
