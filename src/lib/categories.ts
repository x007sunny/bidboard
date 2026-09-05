export const CATEGORIES = [
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
] as const;

export type CategoryName = (typeof CATEGORIES)[number];
