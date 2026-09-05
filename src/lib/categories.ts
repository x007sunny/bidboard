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

export function isCategoryName(value: string): value is CategoryName {
  return (CATEGORIES as readonly string[]).includes(value);
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

export function nationalStates(): string[] {
  return [AU_NATIONAL, ...AU_STATES];
}

export function isNationalListing(states: string[] | null | undefined): boolean {
  const list = states || [];
  return list.includes(AU_NATIONAL) || AU_STATES.every((s) => list.includes(s));
}

/** Expand "Australia" to every state so nationwide listings still match VIC/NSW/… filters. */
export function confirmedStates(input: string[]): string[] {
  const allowed = new Set<string>([AU_NATIONAL, ...AU_STATES]);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const s = raw.trim().toUpperCase();
    if (!allowed.has(s) || seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }
  if (unique.includes(AU_NATIONAL) || AU_STATES.every((s) => unique.includes(s))) {
    return nationalStates();
  }
  return unique.filter((s) => s !== AU_NATIONAL);
}

export function validateTaxonomy(input: {
  category: string;
  subcategory?: string | null;
  states?: string[] | string | null;
}):
  | { ok: true; category: CategoryName; subcategory: string; states: string[] }
  | { ok: false; error: string } {
  const category = (input.category || "").trim();
  if (!isCategoryName(category)) {
    return { ok: false, error: "Please select a category before continuing." };
  }
  const subcategory = (input.subcategory || "").trim();
  if (!isKnownSubcategory(category, subcategory)) {
    return { ok: false, error: "Please select a subcategory before continuing." };
  }
  const rawStates = Array.isArray(input.states) ? input.states : parseStates(input.states);
  const states = confirmedStates(rawStates);
  if (states.length === 0) {
    return { ok: false, error: "Please select a location before continuing." };
  }
  return { ok: true, category, subcategory, states };
}
