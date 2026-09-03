import { AU_NATIONAL, AU_STATES, subcategoriesFor } from "./categories";

export type PageSignals = {
  jsonLd: unknown[];
  headings: string[];
  textSample: string;
};

export type ClassifyInput = {
  category: string;
  title: string;
  description: string;
  url?: string;
  signals?: PageSignals | null;
};

export type ClassifyResult = {
  subcategory: string | null;
  states: string[];
};

const STATE_PATTERNS: Array<[RegExp, string]> = [
  [/\bnew south wales\b|\bN\.?S\.?W\.?\b/i, "NSW"],
  [/\bvictoria\b|\bVIC\b|\bVic\b/i, "VIC"],
  [/\bqueensland\b|\bQLD\b|\bQld\b/i, "QLD"],
  [/\bwestern australia\b|\bW\.?A\.?\b/i, "WA"],
  [/\bsouth australia\b|\bS\.?A\.?\b/i, "SA"],
  [/\btasmania\b|\bTAS\b|\bTas\b/i, "TAS"],
  [/\baustralian capital territory\b|\bA\.?C\.?T\.?\b/i, "ACT"],
  [/\bnorthern territory\b|\bN\.?T\.?\b/i, "NT"],
];

const NATIONAL_RE =
  /australia[- ]wide|nationwide|nation[- ]wide|all (australian )?states|every (australian )?state|across australia|throughout australia|servicing australia|australia's (leading|largest)|national (franchise|network|coverage)/i;

const SCHEMA_TO_SUB: Array<[RegExp, string, string]> = [
  [/plumber/i, "Trades", "Plumbing"],
  [/electrician/i, "Trades", "Electrical"],
  [/hvac|airconditioning|heating.*cooling/i, "Trades", "HVAC & Air Conditioning"],
  [/roofing/i, "Trades", "Roofing"],
  [/painter|housepainter/i, "Trades", "Painting"],
  [/locksmith/i, "Trades", "Locksmith"],
  [/pestcontrol/i, "Trades", "Pest Control"],
  [/generalcontractor|homeandconstruction/i, "Trades", "Building"],
  [/restaurant|foodestablishment/i, "Restaurants", "Other"],
  [/cafeorcoffeeshop/i, "Cafes & Coffee", "Cafe"],
  [/autorepair|autodealer|autorepair/i, "Auto & Transport", "Mechanic"],
  [/realestateagent/i, "Real Estate", "Sales"],
  [/accountant/i, "Professional Services", "Accounting"],
  [/attorney|legal service/i, "Professional Services", "Legal"],
  [/hardwarestore/i, "Retail & Shops", "Hardware"],
  [/grocerystore|supermarket/i, "Retail & Shops", "Groceries"],
  [/electronicsstore/i, "Retail & Shops", "Electronics"],
];

const KEYWORDS: Record<string, Array<[RegExp, string]>> = {
  Trades: [
    [/\b(tv\s*&?\s*antenna|antenna|jims antennas)\b/i, "TV & Antenna"],
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
    [/\bnepalese|nepal|momo\b/i, "Nepalese"],
    [/\bitalian\b/i, "Italian"],
    [/\bindian\b/i, "Indian"],
    [/\bjapanese|sushi|ramen\b/i, "Japanese"],
    [/\bchinese\b/i, "Chinese"],
    [/\bthai\b/i, "Thai"],
    [/\bkorean\b/i, "Korean"],
    [/\bvietnamese|pho\b/i, "Vietnamese"],
    [/\bmexican\b/i, "Mexican"],
    [/\bgreek\b/i, "Greek"],
    [/\blebanese|lebanese\b/i, "Lebanese"],
    [/\bpizza\b/i, "Pizza"],
    [/\bburger/i, "Burgers"],
    [/\bfine dining\b/i, "Fine Dining"],
    [/\bfast food\b/i, "Fast Food"],
    [/\bcafe|caf[eé]\b/i, "Cafe"],
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
    [/\bmechanic|auto repair|servicing\b/i, "Mechanic"],
  ],
  "Retail & Shops": [
    [/\bhardware|bunnings|mitre 10\b/i, "Hardware"],
    [/\bgrocer|supermarket|coles|woolworths\b/i, "Groceries"],
    [/\belectronic|harvey norman|jb hi-?fi\b/i, "Electronics"],
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
    [/\bit\b|software|web (design|dev)/i, "IT"],
    [/\bconsult/i, "Consulting"],
  ],
  "Health & Fitness": [
    [/\bgym|fitness\b/i, "Gym"],
    [/\bphysio\b/i, "Physio"],
    [/\bdental|dentist\b/i, "Dental"],
    [/\bmedical|clinic|gp\b/i, "Medical"],
  ],
  "Real Estate": [
    [/\bpropert(?:y|ies) manag/i, "Property Management"],
    [/\bstrata\b/i, "Strata"],
    [/\breal estate|buy|sell|agent\b/i, "Sales"],
  ],
};

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

function collectStrings(value: unknown, into: string[]) {
  if (!value) return;
  if (typeof value === "string") {
    into.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectStrings(v, into));
    return;
  }
  const rec = asRecord(value);
  if (!rec) return;
  for (const key of ["name", "addressRegion", "addressLocality", "addressCountry", "text"]) {
    if (typeof rec[key] === "string") into.push(rec[key] as string);
  }
  if (rec.address) collectStrings(rec.address, into);
  if (rec.areaServed) collectStrings(rec.areaServed, into);
  if (rec.geo) collectStrings(rec.geo, into);
}

export function extractStatesFromText(text: string): string[] {
  const found = new Set<string>();
  if (!text) return [];
  if (NATIONAL_RE.test(text)) {
    found.add(AU_NATIONAL);
    for (const s of AU_STATES) found.add(s);
    return [...found];
  }
  for (const [re, code] of STATE_PATTERNS) {
    if (re.test(text)) found.add(code);
  }
  return [...found];
}

function statesFromJsonLd(nodes: Record<string, unknown>[]): string[] {
  const blobs: string[] = [];
  for (const node of nodes) {
    collectStrings(node.address, blobs);
    collectStrings(node.areaServed, blobs);
    collectStrings(node.location, blobs);
  }
  const joined = blobs.join(" | ");
  const country = joined;
  const auHint = /australia|\bAU\b|\bAUS\b/i.test(country) || blobs.length > 0;
  if (!auHint && !extractStatesFromText(joined).length) return [];
  return extractStatesFromText(joined);
}

function cuisineFromJsonLd(nodes: Record<string, unknown>[]): string | null {
  for (const node of nodes) {
    const c = node.servesCuisine;
    const values: string[] = [];
    collectStrings(c, values);
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

function schemaSubcategory(category: string, nodes: Record<string, unknown>[]): string | null {
  const allowed = subcategoriesFor(category);
  for (const node of nodes) {
    const type = nodeType(node);
    for (const [re, cat, sub] of SCHEMA_TO_SUB) {
      if (!re.test(type)) continue;
      if (cat === category && allowed.includes(sub)) return sub;
    }
  }
  return null;
}

function keywordSubcategory(category: string, blob: string): string | null {
  const rules = KEYWORDS[category];
  if (!rules) return null;
  const allowed = subcategoriesFor(category);
  for (const [re, sub] of rules) {
    if (re.test(blob) && allowed.includes(sub)) return sub;
  }
  return null;
}

export function classifyListing(input: ClassifyInput): ClassifyResult {
  const category = input.category || "Other";
  const nodes = flattenJsonLd(input.signals?.jsonLd || []);
  const headingText = (input.signals?.headings || []).join(" ");
  const blob = [
    input.title,
    input.description,
    input.url || "",
    headingText,
    input.signals?.textSample || "",
  ]
    .join(" \n ")
    .slice(0, 12000);

  let subcategory =
    (category === "Restaurants" ? cuisineFromJsonLd(nodes) : null) ||
    schemaSubcategory(category, nodes) ||
    keywordSubcategory(category, blob);

  if (subcategory && !subcategoriesFor(category).includes(subcategory)) {
    subcategory = null;
  }

  let states = statesFromJsonLd(nodes);
  if (states.length === 0) {
    states = extractStatesFromText(blob);
  }

  const allowed = new Set<string>([AU_NATIONAL, ...AU_STATES]);
  states = [...new Set(states.filter((s) => allowed.has(s)))];

  return { subcategory, states };
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

export function extractTextSample(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}
