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

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
export type AuState = (typeof AU_STATES)[number];
export const AU_NATIONAL = "AU";

export const SUBCATEGORIES: Record<string, readonly string[]> = {
  Restaurants: [
    "Italian",
    "Indian",
    "Japanese",
    "Chinese",
    "Thai",
    "Korean",
    "Vietnamese",
    "Nepalese",
    "Mexican",
    "Greek",
    "Lebanese",
    "Pizza",
    "Burgers",
    "Cafe",
    "Fine Dining",
    "Fast Food",
    "Other",
  ],
  "Cafes & Coffee": ["Cafe", "Coffee", "Bakery", "Other"],
  "Home Services": ["Cleaning", "Pest Control", "Gardening", "Pool", "Moving", "Other"],
  Trades: [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Roofing",
    "HVAC & Air Conditioning",
    "Landscaping",
    "Tiling",
    "Flooring",
    "Pest Control",
    "Cleaning",
    "Fencing",
    "Handyman",
    "TV & Antenna",
    "Locksmith",
    "Glazing",
    "Concreting",
    "Building",
    "Renovation",
    "Security",
    "Other",
  ],
  "Beauty & Wellness": ["Hair", "Nails", "Spa", "Barber", "Other"],
  "Auto & Transport": ["Mechanic", "Auto Electrical", "Tyres", "Towing", "Detailing", "Other"],
  "Retail & Shops": ["Hardware", "Groceries", "Fashion", "Electronics", "Pharmacy", "Other"],
  "Online Shops": ["Fashion", "Electronics", "Home", "Food", "Marketplace", "Other"],
  "Professional Services": [
    "Accounting",
    "Legal",
    "Finance",
    "Marketing",
    "Consulting",
    "IT",
    "Other",
  ],
  "Health & Fitness": ["Gym", "Physio", "Dental", "Medical", "Other"],
  "Real Estate": ["Sales", "Property Management", "Strata", "Other"],
  Other: ["Other"],
};

export function subcategoriesFor(category: string): readonly string[] {
  return SUBCATEGORIES[category] || ["Other"];
}

export function isKnownSubcategory(category: string, sub: string | null | undefined): boolean {
  if (!sub) return false;
  return subcategoriesFor(category).includes(sub);
}

export function parseStates(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const allowed = new Set<string>([AU_NATIONAL, ...AU_STATES]);
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => allowed.has(s));
}

export function formatStatesMeta(states: string[]): string {
  return states.join(",");
}
