import { AU_NATIONAL, AU_STATES, CATEGORIES, subcategoriesFor } from "./categories";

export type PageSignals = {
  jsonLd: unknown[];
  headings: string[];
  textSample: string;
  regionHints?: string[];
};

export type ClassifyInput = {
  category?: string;
  title: string;
  description: string;
  url?: string;
  signals?: PageSignals | null;
};

export type ClassifyResult = {
  category: string;
  subcategory: string | null;
  states: string[];
  confident: {
    category: boolean;
    subcategory: boolean;
    states: boolean;
  };
};

const STATE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:AU-)?NSW\b|\bnew south wales\b/i, "NSW"],
  [/\b(?:AU-)?VIC\b|\bvictoria\b(?!\s+(st|street|rd|road|ave|parade))/i, "VIC"],
  [/\b(?:AU-)?QLD\b|\bqueensland\b/i, "QLD"],
  [/\b(?:AU-)?WA\b|\bwestern australia\b/i, "WA"],
  [/\b(?:AU-)?SA\b|\bsouth australia\b/i, "SA"],
  [/\b(?:AU-)?TAS\b|\btasmania\b/i, "TAS"],
  [/\b(?:AU-)?ACT\b|\baustralian capital territory\b/i, "ACT"],
  [/\b(?:AU-)?NT\b|\bnorthern territory\b/i, "NT"],
];

const CITY_TO_STATE: Array<[RegExp, string]> = [
  [/\bmelbourne\b/i, "VIC"],
  [/\bgeelong\b/i, "VIC"],
  [/\bwerribee\b/i, "VIC"],
  [/\bhoppers crossing\b/i, "VIC"],
  [/\bballarat\b/i, "VIC"],
  [/\bbendigo\b/i, "VIC"],
  [/\bsydney\b/i, "NSW"],
  [/\bnewcastle\b/i, "NSW"],
  [/\bwollongong\b/i, "NSW"],
  [/\bbrisbane\b/i, "QLD"],
  [/\bgold coast\b/i, "QLD"],
  [/\bcairns\b/i, "QLD"],
  [/\bperth\b/i, "WA"],
  [/\badelaide\b/i, "SA"],
  [/\bhobart\b/i, "TAS"],
  [/\bdarwin\b/i, "NT"],
  [/\bcanberra\b/i, "ACT"],
];

const NATIONAL_RE =
  /australia[- ]wide|nationwide|nation[- ]wide|all (australian )?states|every (australian )?state|across australia|throughout australia|national (franchise|network|coverage)|servicing all (of )?australia/i;

const SERVICE_CONTEXT_RE =
  /\b(servicing|we service|service area|areas? (we )?serv|located in|based in|offices? in|operating in|we operate|covering|across|throughout|available in|visit us|our locations?)\b/i;

const SCHEMA_MAP: Array<[RegExp, string, string]> = [
  [/plumber/i, "Trades", "Plumbing"],
  [/electrician/i, "Trades", "Electrical"],
  [/hvac|airconditioning/i, "Trades", "HVAC & Air Conditioning"],
  [/roofing/i, "Trades", "Roofing"],
  [/painter|housepainter/i, "Trades", "Painting"],
  [/locksmith/i, "Trades", "Locksmith"],
  [/pestcontrol/i, "Trades", "Pest Control"],
  [/generalcontractor|homeandconstruction/i, "Trades", "Building"],
  [/restaurant|foodestablishment/i, "Restaurants", "Other"],
  [/cafeorcoffeeshop/i, "Cafes & Coffee", "Cafe"],
  [/autorepair|autodealer/i, "Auto & Transport", "Mechanic"],
  [/realestateagent/i, "Real Estate", "Sales"],
  [/accountant/i, "Professional Services", "Accounting"],
  [/attorney|legalservice/i, "Professional Services", "Legal"],
  [/hardwarestore/i, "Retail & Shops", "Hardware"],
  [/grocerystore|supermarket/i, "Retail & Shops", "Groceries"],
  [/electronicsstore/i, "Retail & Shops", "Electronics"],
];

const KEYWORDS: Record<string, Array<[RegExp, string]>> = {
  Trades: [
    [/\b(tv\s*&?\s*antenna|\bantenna\b|satellite (tv|dish))\b/i, "TV & Antenna"],
    [/\bplumb(?:er|ing)|blocked drain|hot water|gas fitt/i, "Plumbing"],
    [/\belectrician|electrical\b/i, "Electrical"],
    [/\broof(?:er|ing)\b/i, "Roofing"],
    [/\bpaint(?:er|ing)\b/i, "Painting"],
    [/\bhvac|air.?cond|split system|ducted\b/i, "HVAC & Air Conditioning"],
    [/\bcarpenter|carpentry|joinery\b/i, "Carpentry"],
    [/\btiler|tiling\b/i, "Tiling"],
    [/\bfloor(?:ing|s)\b/i, "Flooring"],
    [/\blandscap/i, "Landscaping"],
    [/\bpest control\b/i, "Pest Control"],
    [/\bclean(?:ing|ers)\b/i, "Cleaning"],
    [/\bfenc(?:e|ing)\b/i, "Fencing"],
    [/\bhandyman\b/i, "Handyman"],
    [/\blocksmith\b/i, "Locksmith"],
    [/\bglaz(?:ier|ing)|window repair\b/i, "Glazing"],
    [/\bconcret/i, "Concreting"],
    [/\brenovat/i, "Renovation"],
    [/\bsecurity (system|alarm|camera)/i, "Security"],
    [/\bbuilder|building\b/i, "Building"],
  ],
  Restaurants: [
    [/\bnepalese|\bnepal\b|\bmomo\b/i, "Nepalese"],
    [/\bitalian\b/i, "Italian"],
    [/\bindian\b/i, "Indian"],
    [/\bjapanese|sushi|ramen\b/i, "Japanese"],
    [/\bchinese\b/i, "Chinese"],
    [/\bthai\b/i, "Thai"],
    [/\bkorean\b/i, "Korean"],
    [/\bvietnamese|\bpho\b/i, "Vietnamese"],
    [/\bmexican\b/i, "Mexican"],
    [/\bgreek\b/i, "Greek"],
    [/\blebanese\b/i, "Lebanese"],
    [/\bpizza\b/i, "Pizza"],
    [/\bburger/i, "Burgers"],
    [/\bfine dining\b/i, "Fine Dining"],
    [/\bfast food\b/i, "Fast Food"],
    [/\bcafe|caf[eé]\b/i, "Cafe"],
    [/\brestaurant\b/i, "Other"],
  ],
  "Cafes & Coffee": [
    [/\bbakery|patisserie\b/i, "Bakery"],
    [/\bcoffee\b/i, "Coffee"],
    [/\bcafe|caf[eé]\b/i, "Cafe"],
  ],
  "Home Services": [
    [/\bpest control\b/i, "Pest Control"],
    [/\bclean(?:ing|ers)\b/i, "Cleaning"],
    [/\bgarden|lawn\b/i, "Gardening"],
    [/\bpool\b/i, "Pool"],
    [/\bmov(?:ing|ers)\b/i, "Moving"],
  ],
  "Beauty & Wellness": [
    [/\bbarber\b/i, "Barber"],
    [/\bnail\b/i, "Nails"],
    [/\bspa|massage\b/i, "Spa"],
    [/\bhair|salon\b/i, "Hair"],
  ],
  "Auto & Transport": [
    [/\btow(?:ing|truck)\b/i, "Towing"],
    [/\btyre|tire\b/i, "Tyres"],
    [/\bdetail(?:ing)?\b/i, "Detailing"],
    [/\bauto electric/i, "Auto Electrical"],
    [/\bmechanic|auto repair\b/i, "Mechanic"],
  ],
  "Retail & Shops": [
    [/\bhardware store|hardware\b/i, "Hardware"],
    [/\bgrocer|supermarket\b/i, "Groceries"],
    [/\belectronic\b/i, "Electronics"],
    [/\bpharm/i, "Pharmacy"],
    [/\bfashion|clothing|apparel\b/i, "Fashion"],
  ],
  "Online Shops": [
    [/\belectronic\b/i, "Electronics"],
    [/\bfashion|clothing\b/i, "Fashion"],
    [/\bmarketplace\b/i, "Marketplace"],
    [/\bfood|grocery\b/i, "Food"],
    [/\bhome|furniture\b/i, "Home"],
  ],
  "Professional Services": [
    [/\baccount(?:ant|ing)\b/i, "Accounting"],
    [/\blawyer|solicitor|legal\b/i, "Legal"],
    [/\bfinanc|mortgage|afsl\b/i, "Finance"],
    [/\bmarket(?:ing|er)\b/i, "Marketing"],
    [/\bsoftware|web (design|dev)|\bIT services\b/i, "IT"],
    [/\bconsult/i, "Consulting"],
  ],
  "Health & Fitness": [
    [/\bgym|fitness\b/i, "Gym"],
    [/\bphysio\b/i, "Physio"],
    [/\bdental|dentist\b/i, "Dental"],
    [/\bmedical|clinic|\bgp\b/i, "Medical"],
  ],
  "Real Estate": [
    [/\bpropert(?:y|ies) manag/i, "Property Management"],
    [/\bstrata\b/i, "Strata"],
    [/\breal estate|\bbuying agent|\bselling agent\b/i, "Sales"],
  ],
};

const CATEGORY_CONFIDENT_MIN = 6;

function asRecord(node: unknown): Record<string, unknown> | null {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    return node as Record<string, unknown>;
  }
  return null;
}

function flattenJsonLd(nodes: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    const rec = asRecord(n);
    if (!rec) return;
    if (rec["@graph"]) walk(rec["@graph"]);
    out.push(rec);
  };
  nodes.forEach(walk);
  return out;
}

function nodeType(node: Record<string, unknown>): string {
  const t = node["@type"];
  if (Array.isArray(t)) return t.join(" ");
  return typeof t === "string" ? t : "";
}

function collectLocationText(value: unknown, into: string[], opts?: { includeCountry?: boolean }) {
  if (!value) return;
  if (typeof value === "string") {
    into.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectLocationText(v, into, opts));
    return;
  }
  const rec = asRecord(value);
  if (!rec) return;
  const keys = opts?.includeCountry
    ? ["name", "addressRegion", "addressLocality", "addressCountry", "text"]
    : ["name", "addressRegion", "addressLocality", "text"];
  for (const key of keys) {
    if (typeof rec[key] === "string") into.push(rec[key] as string);
  }
  if (rec.address) collectLocationText(rec.address, into, opts);
  if (rec.geo) collectLocationText(rec.geo, into, opts);
}

function deepWalk(nodes: unknown[], visit: (rec: Record<string, unknown>) => void) {
  const seen = new Set<unknown>();
  const walk = (n: unknown) => {
    if (!n || typeof n !== "object") return;
    if (seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    const rec = n as Record<string, unknown>;
    visit(rec);
    for (const v of Object.values(rec)) walk(v);
  };
  nodes.forEach(walk);
}

function uniqueStates(codes: string[]): string[] {
  const allowed = new Set<string>([AU_NATIONAL, ...AU_STATES]);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of codes) {
    const s = raw.toUpperCase();
    if (!allowed.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function nationalSet(): string[] {
  return uniqueStates([AU_NATIONAL, ...AU_STATES]);
}

function statesFromBlob(text: string, allowCities = true): string[] {
  const found = new Set<string>();
  if (!text) return [];
  if (NATIONAL_RE.test(text)) return nationalSet();
  for (const [re, code] of STATE_PATTERNS) {
    if (re.test(text)) found.add(code);
  }
  if (allowCities) {
    for (const [re, code] of CITY_TO_STATE) {
      if (re.test(text)) found.add(code);
    }
  }
  return uniqueStates([...found]);
}

function areaServedIsNational(value: unknown): boolean {
  let national = false;
  const walk = (n: unknown) => {
    if (national || !n) return;
    if (typeof n === "string") {
      if (NATIONAL_RE.test(n)) national = true;
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    const rec = asRecord(n);
    if (!rec) return;
    const type = nodeType(rec);
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (/country/i.test(type) && /^(australia|au)$/i.test(name)) {
      national = true;
      return;
    }
    if (typeof rec.name === "string" && NATIONAL_RE.test(rec.name)) {
      national = true;
      return;
    }
    for (const v of Object.values(rec)) walk(v);
  };
  walk(value);
  return national;
}

function statesFromJsonLd(nodes: Record<string, unknown>[]): string[] {
  const served: string[] = [];
  const addresses: string[] = [];
  let servedNational = false;

  deepWalk(nodes, (rec) => {
    if (rec.areaServed) {
      if (areaServedIsNational(rec.areaServed)) servedNational = true;
      collectLocationText(rec.areaServed, served, { includeCountry: false });
    }
    if (rec.address) collectLocationText(rec.address, addresses, { includeCountry: false });
    if (rec.location) collectLocationText(rec.location, addresses, { includeCountry: false });
  });

  if (servedNational) return nationalSet();

  const fromServed = statesFromBlob(served.join(" | "), true);
  const fromAddress = statesFromBlob(addresses.join(" | "), true);
  // Union every structured region — do not stop at the first state.
  return uniqueStates([...fromServed, ...fromAddress]);
}

function statesFromPageText(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  if (NATIONAL_RE.test(text)) return nationalSet();
  const windowSize = 90;
  for (let i = 0; i < text.length; i += 40) {
    const slice = text.slice(Math.max(0, i - 20), i + windowSize);
    if (!SERVICE_CONTEXT_RE.test(slice) && !/\b\d{4}\b/.test(slice)) continue;
    for (const s of statesFromBlob(slice, true)) found.add(s);
  }
  return uniqueStates([...found]);
}

function cuisineFromJsonLd(nodes: Record<string, unknown>[]): string | null {
  for (const node of nodes) {
    const values: string[] = [];
    collectLocationText(node.servesCuisine, values, { includeCountry: false });
    const blob = values.join(" ").toLowerCase();
    if (!blob) continue;
    const map: Array<[RegExp, string]> = [
      [/nepal/, "Nepalese"],
      [/italian/, "Italian"],
      [/indian/, "Indian"],
      [/japan|sushi/, "Japanese"],
      [/chinese/, "Chinese"],
      [/thai/, "Thai"],
      [/korean/, "Korean"],
      [/vietnam/, "Vietnamese"],
      [/mexican/, "Mexican"],
      [/greek/, "Greek"],
      [/leban/, "Lebanese"],
      [/pizza/, "Pizza"],
      [/burger/, "Burgers"],
    ];
    for (const [re, label] of map) {
      if (re.test(blob)) return label;
    }
  }
  return null;
}

function schemaGuess(nodes: Record<string, unknown>[]): { category: string; subcategory: string } | null {
  for (const node of nodes) {
    const type = nodeType(node);
    for (const [re, cat, sub] of SCHEMA_MAP) {
      if (re.test(type)) return { category: cat, subcategory: sub };
    }
  }
  return null;
}

function keywordHits(
  blob: string,
  weight: number
): Array<{ category: string; subcategory: string; score: number }> {
  const hits: Array<{ category: string; subcategory: string; score: number }> = [];
  if (!blob) return hits;
  for (const [category, rules] of Object.entries(KEYWORDS)) {
    for (const [re, sub] of rules) {
      if (re.test(blob)) hits.push({ category, subcategory: sub, score: weight });
    }
  }
  return hits;
}

function hostnameOf(url: string | undefined): string {
  try {
    return new URL(url || "https://x.invalid").hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function classifyListing(input: ClassifyInput): ClassifyResult {
  const hint = CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])
    ? (input.category as string)
    : "";
  const nodes = flattenJsonLd(input.signals?.jsonLd || []);
  const headingText = (input.signals?.headings || []).join(" ");
  const titleDesc = [input.title, input.description].join(" \n ");
  const pageText = input.signals?.textSample || "";
  const host = hostnameOf(input.url);

  type CatScore = { score: number; subs: Map<string, number> };
  const scores = new Map<string, CatScore>();
  const bump = (category: string, subcategory: string | null, score: number) => {
    const cur = scores.get(category) || { score: 0, subs: new Map() };
    cur.score += score;
    if (subcategory && subcategory !== "Other") {
      cur.subs.set(subcategory, (cur.subs.get(subcategory) || 0) + score);
    }
    scores.set(category, cur);
  };

  const schema = schemaGuess(nodes);
  if (schema) bump(schema.category, schema.subcategory, 12);

  const cuisine = cuisineFromJsonLd(nodes);
  if (cuisine) bump("Restaurants", cuisine, 10);

  // Generic hostname tokens only — not brand names.
  if (/plumb/.test(host)) bump("Trades", "Plumbing", 8);
  if (/antenna/.test(host)) bump("Trades", "TV & Antenna", 8);
  if (/electric/.test(host)) bump("Trades", "Electrical", 8);

  for (const hit of keywordHits(titleDesc, 6)) bump(hit.category, hit.subcategory, hit.score);
  for (const hit of keywordHits(headingText, 4)) bump(hit.category, hit.subcategory, hit.score);
  for (const hit of keywordHits(pageText.slice(0, 2500), 1)) bump(hit.category, hit.subcategory, hit.score);

  // User-selected category is a hint, never the only source.
  if (hint) bump(hint, null, 2);

  let category = "Other";
  let best = -1;
  for (const [cat, val] of scores.entries()) {
    if (val.score > best) {
      best = val.score;
      category = cat;
    }
  }

  if (schema && (scores.get(schema.category)?.score || 0) >= 12) {
    category = schema.category;
  }

  const categoryConfident = best >= CATEGORY_CONFIDENT_MIN;
  if (!categoryConfident) {
    category = hint && hint !== "Other" ? hint : "Other";
  }

  const pickSub = (cat: string): string | null => {
    const subs = scores.get(cat)?.subs;
    if (!subs || subs.size === 0) return null;
    let name: string | null = null;
    let n = -1;
    for (const [sub, sc] of subs.entries()) {
      if (sc > n) {
        n = sc;
        name = sub;
      }
    }
    return name;
  };

  let subcategory = categoryConfident ? pickSub(category) : null;
  if (categoryConfident && category === "Restaurants" && cuisine) subcategory = cuisine;

  if (subcategory && !subcategoriesFor(category).includes(subcategory)) {
    subcategory = keywordHits(titleDesc, 1).find((h) => h.category === category)?.subcategory || null;
  }
  if (subcategory && !subcategoriesFor(category).includes(subcategory)) subcategory = null;

  const structuredStates = statesFromJsonLd(nodes);
  const isoHints = uniqueStates(input.signals?.regionHints || []);
  const identityBlob = [titleDesc, headingText].join(" \n ");
  const identityHasNational = NATIONAL_RE.test(identityBlob);
  const identityStates = identityHasNational ? nationalSet() : statesFromBlob(identityBlob, true);

  let states: string[];
  if (structuredStates.length || isoHints.length) {
    states = uniqueStates([...structuredStates, ...isoHints]);
    if (identityHasNational) states = uniqueStates([...states, ...nationalSet()]);
  } else if (identityStates.length) {
    states = identityStates;
  } else {
    states = statesFromPageText(pageText);
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) category = "Other";

  return {
    category,
    subcategory,
    states,
    confident: {
      category: categoryConfident,
      subcategory: categoryConfident && !!subcategory,
      states: states.length > 0,
    },
  };
}

export function parseJsonLdBlocks(html: string): unknown[] {
  const blocks =
    html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const nodes: unknown[] = [];
  for (const block of blocks) {
    const inner = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      nodes.push(JSON.parse(inner));
    } catch {
      // ignore broken JSON-LD
    }
  }
  return nodes;
}

export function extractHeadings(html: string): string[] {
  const out: string[] = [];
  const re = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 20) {
    const text = m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push(text.slice(0, 160));
  }
  return out;
}

function metaContentByName(html: string, name: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const needle = name.toLowerCase();
  for (const tag of tags) {
    const nameMatch = tag.match(/name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const n = (nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3] || "").toLowerCase();
    if (n !== needle) continue;
    const contentMatch = tag.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const c = (contentMatch?.[1] || contentMatch?.[2] || contentMatch?.[3] || "").trim();
    if (c) return c;
  }
  return null;
}

export function extractRegionHints(html: string): string[] {
  const found = new Set<string>();
  const re = /AU-(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) found.add(m[1].toUpperCase());

  const geo = metaContentByName(html, "geo.region") || "";
  for (const s of statesFromBlob(geo, false)) found.add(s);
  const place = metaContentByName(html, "geo.placename") || "";
  for (const s of statesFromBlob(place, true)) found.add(s);

  return uniqueStates([...found]);
}

export function extractTextSample(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}
