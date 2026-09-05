import { classifyListing } from "../src/lib/classifyListing.ts";
import { AU_NATIONAL, AU_STATES, validateTaxonomy } from "../src/lib/categories.ts";
import { listingWhere, matchesListingWhere } from "../src/lib/listingWhere.ts";

let failed = 0;
function assert(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log("ok ", name);
    return;
  }
  failed += 1;
  console.log("FAIL", name, detail ?? "");
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x)) && b.every((x) => a.includes(x));
}

const pans = classifyListing({
  category: "Other",
  title: "Pans On Fire, Werribee (Nepalese) - Order online from our menu | Pans on Fire",
  description: "Order from Pans on Fire in Werribee 3030. Browse the full menu, check prices and enjoy freshly made takeaway and delivery with Yumbo Jumbo (AU).",
  url: "https://pansonfire.yumbojumbo.com.au/",
  signals: {
    jsonLd: [],
    headings: ["Pans on Fire"],
    textSample: "Pans on Fire Nepalese 8/51-53 Synnot St WERRIBEE VIC 3030 Online Menu Takeaway & Delivery",
    regionHints: ["VIC"],
  },
});
assert("pans category", pans.category === "Restaurants", pans);
assert("pans subcategory", pans.subcategory === "Nepalese", pans);
assert("pans states", sameSet(pans.states, ["VIC"]), pans);
assert("pans confident", pans.confident.category && pans.confident.subcategory && pans.confident.states, pans);

const danzers = classifyListing({
  category: "Other",
  title: "Danzer's Plumbing | Professional Local Plumber Near You | Plumbers Hoppers Crossing",
  description: "Danzer's Plumbing, your local Hoppers Crossing Plumber. We cover all aspects of plumbing from repairing leaks, hot water heaters, blockages and new home renovations.",
  url: "https://www.danzersplumbing.com.au/",
  signals: {
    jsonLd: [
      {
        "@type": "product",
        name: "Danzer’s Plumbing & Gas Services",
        description: "Danzer's Plumbing, your local Hoppers Crossing Plumber.",
      },
    ],
    headings: ["Our service areas", "Always On-Time Expert Plumbers"],
    textSample:
      "Service area Plumber Werribee South Plumber Hoppers Crossing Plumber Point Cook Locally owned & operated plumbing contractor",
  },
});
assert("danzers category", danzers.category === "Trades", danzers);
assert("danzers subcategory", danzers.subcategory === "Plumbing", danzers);
assert("danzers states", sameSet(danzers.states, ["VIC"]), danzers);

const metro = classifyListing({
  category: "Restaurants",
  title: "Metropolitan Plumbing | Service Within 1 Hour* | 24/7 Experts",
  description: "Metropolitan Plumbing is your local plumbing expert! We provide 24/7* service for hot water, blocked drains, leaking taps, gas fitting and more.",
  url: "https://metropolitanplumbing.com.au/",
  signals: {
    jsonLd: [
      {
        "@type": "Organization",
        name: "Metropolitan Plumbing",
        contactPoint: [
          {
            "@type": "ContactPoint",
            areaServed: ["AU-SA, AU-VIC, AU-QLD, AU-WA, AU-NSW, AU-ACT"],
          },
        ],
      },
    ],
    headings: ["Plumbers You Can Trust"],
    textSample: "Locations Adelaide Brisbane Canberra Geelong Melbourne Sydney Perth Plumbing Electrical Air Conditioning",
    regionHints: ["SA", "VIC", "QLD", "WA", "NSW", "ACT"],
  },
});
assert("metro category beats hint", metro.category === "Trades", metro);
assert("metro subcategory", metro.subcategory === "Plumbing", metro);
assert(
  "metro all areaServed states, not first only, no TAS",
  sameSet(metro.states, ["SA", "VIC", "QLD", "WA", "NSW", "ACT"]),
  metro
);

const jimsBlocked = classifyListing({
  title: "Jimsantennas",
  description: "",
  url: "https://www.jimsantennas.com.au/",
});
assert("jims hostname category", jimsBlocked.category === "Trades", jimsBlocked);
assert("jims hostname sub", jimsBlocked.subcategory === "TV & Antenna", jimsBlocked);
assert("jims blocked does not invent states", jimsBlocked.states.length === 0, jimsBlocked);
assert("jims location not confident", jimsBlocked.confident.states === false, jimsBlocked);

const jimsNational = classifyListing({
  title: "Jim's Antennas",
  description: "TV and antenna installation nationwide across Australia.",
  url: "https://www.jimsantennas.com.au/",
  signals: {
    jsonLd: [],
    headings: ["TV & Antenna"],
    textSample: "Servicing all of Australia with local franchisees in every state.",
  },
});
assert("jims national category", jimsNational.category === "Trades", jimsNational);
assert("jims national sub", jimsNational.subcategory === "TV & Antenna", jimsNational);
assert("jims national states", sameSet(jimsNational.states, [AU_NATIONAL, ...AU_STATES]), jimsNational);

const cafe = classifyListing({
  category: "Other",
  title: "Local Cafe",
  description: "Coffee and brunch in Melbourne",
  url: "https://localcafe.example.com.au/",
  signals: {
    jsonLd: [
      {
        "@type": "CafeOrCoffeeShop",
        name: "Local Cafe",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Melbourne",
          addressRegion: "VIC",
          addressCountry: "Australia",
        },
      },
    ],
    headings: [],
    textSample: "Best coffee in Melbourne, Australia. Visit us on Chapel Street.",
  },
});
assert("addressCountry Australia is not national", sameSet(cafe.states, ["VIC"]), cafe);
assert("cafe schema category", cafe.category === "Cafes & Coffee", cafe);

const incidental = classifyListing({
  title: "Harbour Plumbing Sydney",
  description: "Blocked drains and hot water in Sydney.",
  url: "https://harbourplumbing.example.com.au/",
  signals: {
    jsonLd: [
      {
        "@type": "Plumber",
        address: { addressRegion: "NSW", addressCountry: "Australia" },
      },
    ],
    headings: ["Sydney plumber"],
    textSample:
      "Unlike VIC regulations, NSW licensed plumbers must follow a different code. We only operate in Sydney.",
  },
});
assert("incidental VIC mention is ignored when JSON-LD has NSW", sameSet(incidental.states, ["NSW"]), incidental);

const unknown = classifyListing({
  title: "Welcome",
  description: "",
  url: "https://randomsite.example.com.au/",
});
assert("unknown category Other", unknown.category === "Other", unknown);
assert("unknown not a silent guess", unknown.confident.category === false, unknown);
assert("unknown no subcategory", unknown.subcategory === null, unknown);
assert("unknown no invented states", unknown.states.length === 0, unknown);

const auWhere = listingWhere({ category: "Trades", state: "AU" });
const vicWhere = listingWhere({ category: "Trades", state: "VIC" });
assert("Australia where has no states predicate", auWhere.states === undefined && auWhere.category === "Trades", auWhere);
assert("VIC where uses has", (vicWhere.states as { has?: string })?.has === "VIC", vicWhere);

const national = { category: "Trades", subcategory: "Plumbing", states: [AU_NATIONAL, ...AU_STATES] };
const vicOnly = { category: "Trades", subcategory: "Plumbing", states: ["VIC"] };
const nswVic = { category: "Trades", subcategory: "Plumbing", states: ["NSW", "VIC"] };
const empty = { category: "Trades", subcategory: "Plumbing", states: [] as string[] };
assert("AU shows VIC-only", matchesListingWhere(vicOnly, { category: "Trades", state: "AU" }));
assert("AU shows multi-state", matchesListingWhere(nswVic, { category: "Trades", state: "AU" }));
assert("AU shows national", matchesListingWhere(national, { category: "Trades", state: "AU" }));
assert("AU shows empty states", matchesListingWhere(empty, { category: "Trades", state: "AU" }));
assert("VIC shows VIC-only", matchesListingWhere(vicOnly, { category: "Trades", state: "VIC" }));
assert("VIC shows national", matchesListingWhere(national, { category: "Trades", state: "VIC" }));
assert("VIC hides NSW-only", !matchesListingWhere({ ...nswVic, states: ["NSW"] }, { category: "Trades", state: "VIC" }));

const fake: Array<{ id: number; bidCents: number; category: string; subcategory: string; states: string[] }> = [];
for (let i = 0; i < 250; i++) {
  fake.push({
    id: i,
    bidCents: 25000 - i,
    category: i % 2 === 0 ? "Restaurants" : "Trades",
    subcategory: i % 2 === 0 ? "Italian" : "Plumbing",
    states: i < 10 ? [AU_NATIONAL, ...AU_STATES] : i < 100 ? ["VIC"] : ["NSW"],
  });
}
const tradesAll = fake.filter((l) => matchesListingWhere(l, { category: "Trades", state: "AU" }));
const tradesVic = fake.filter((l) => matchesListingWhere(l, { category: "Trades", state: "VIC" }));
const top200ThenFilter = fake
  .slice()
  .sort((a, b) => b.bidCents - a.bidCents)
  .slice(0, 200)
  .filter((l) => matchesListingWhere(l, { category: "Trades" }));
assert("DB-style filter finds all 125 trades, not the first 200 overall", tradesAll.length === 125, tradesAll.length);
assert(
  "JS slice of 200 would miss trades ranked 201+",
  top200ThenFilter.length === 100 && tradesAll.length > top200ThenFilter.length,
  { top200: top200ThenFilter.length, all: tradesAll.length }
);
assert("VIC trades include VIC-only + national, not NSW-only", tradesVic.length === 50, tradesVic.length);

const taxOk = validateTaxonomy({ category: "Restaurants", subcategory: "Indian", states: ["VIC"] });
assert("taxonomy accepts confirmed edit", taxOk.ok && taxOk.ok && taxOk.category === "Restaurants" && taxOk.subcategory === "Indian", taxOk);
const taxBadCat = validateTaxonomy({ category: "Widgets", subcategory: "Other", states: ["VIC"] });
assert("taxonomy rejects invented category", !taxBadCat.ok, taxBadCat);
const taxBadSub = validateTaxonomy({ category: "Trades", subcategory: "Nepalese", states: ["VIC"] });
assert("taxonomy rejects subcategory from another category", !taxBadSub.ok, taxBadSub);
const taxAu = validateTaxonomy({ category: "Trades", subcategory: "Plumbing", states: ["AU"] });
assert("Australia-wide expands to all states", taxAu.ok && taxAu.ok && sameSet(taxAu.states, [AU_NATIONAL, ...AU_STATES]), taxAu);
const taxEmpty = validateTaxonomy({ category: "Trades", subcategory: "Plumbing", states: [] });
assert("taxonomy requires location", !taxEmpty.ok, taxEmpty);

console.log("\nunit failures:", failed);

if (process.argv.includes("--live")) {
  const { fetchWebsiteMetadata } = await import("../src/lib/fetchWebsiteMetadata.ts");
  const urls = [
    "https://pansonfire.yumbojumbo.com.au/",
    "https://www.danzersplumbing.com.au/",
    "https://metropolitanplumbing.com.au/",
    "https://www.jimsantennas.com.au/",
    "https://www.bunnings.com.au/",
  ];
  for (const url of urls) {
    try {
      const m = await fetchWebsiteMetadata(url);
      const c = classifyListing({
        title: m.title,
        description: m.description,
        url: m.canonicalUrl || url,
        signals: m.signals,
      });
      console.log("---", url);
      console.log("title:", m.title);
      console.log("desc:", (m.description || "").slice(0, 140));
      console.log("scraped:", m.scraped);
      console.log("signals:", m.signals ? `jsonLd=${m.signals.jsonLd.length} hints=${(m.signals.regionHints || []).join(",")}` : "none");
      console.log("class:", JSON.stringify(c));
    } catch (e: any) {
      console.log("---", url, "ERR", e?.message || e);
    }
  }
}

if (failed) process.exit(1);
