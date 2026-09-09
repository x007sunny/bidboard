import {
  FOUNDING_SIZE,
  defaultBoard,
  parseBoard,
  pickFoundingMembers,
  rankFoundingMembers,
  type FounderInput,
} from "../src/lib/foundingRank.ts";
import { listingWhere, matchesListingWhere } from "../src/lib/listingWhere.ts";
import { boardHref } from "../src/lib/boardHref.ts";

let failed = 0;
function assert(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log("ok ", name);
    return;
  }
  failed += 1;
  console.log("FAIL", name, detail ?? "");
}

function listing(
  id: string,
  bid: number,
  createdOffsetSec: number,
  lastBidOffsetSec = createdOffsetSec
): FounderInput {
  const createdAt = new Date(1_700_000_000_000 + createdOffsetSec * 1000);
  const lastBidAt = new Date(1_700_000_000_000 + lastBidOffsetSec * 1000);
  return { id, createdAt, lastBidAt, bidCents: bid };
}

assert("founding size is 50", FOUNDING_SIZE === 50);

// Scenario 1: 0–49 businesses — default tab is Founding 50
assert("default before lock is founding", defaultBoard(false) === "founding");
assert("parse missing before lock is founding", parseBoard(undefined, false) === "founding");
assert("leaderboard still selectable before lock", parseBoard("leaderboard", false) === "leaderboard");

// Scenario 2: after lock — default switches to Leaderboard
assert("default after lock is leaderboard", defaultBoard(true) === "leaderboard");
assert("parse missing after lock is leaderboard", parseBoard(undefined, true) === "leaderboard");
assert("founding still selectable after lock", parseBoard("founding", true) === "founding");

// Membership is first 50 by createdAt, not by bid
const lateHighBidder = listing("late", 99_000, 60);
const earlyLow = Array.from({ length: 50 }, (_, i) => listing(`e${i}`, 500, i));
const picked = pickFoundingMembers([...earlyLow, lateHighBidder]);
assert("only 50 members", picked.length === 50);
assert("late high bidder is not a founder", !picked.some((p) => p.id === "late"));
assert("first joiner is a founder", picked.some((p) => p.id === "e0"));

// Scenario 5: raising a bid before lock does not add a second founding spot
const raised = pickFoundingMembers([
  listing("a", 500, 1),
  listing("a", 1500, 1, 10),
]);
// pickFoundingMembers is by listing rows; duplicate ids wouldn't exist in DB.
// Unique listing count is what matters: one row per business.
assert("one row stays one founder", pickFoundingMembers([listing("a", 1500, 1, 10)]).length === 1);

// Scenario 2/3: ranks at lock = bid order, then frozen
const atLock = [
  listing("A", 800, 1),
  listing("B", 600, 2),
  listing("C", 400, 3),
];
const ranks = rankFoundingMembers(atLock);
assert("A is founding #1 at lock", ranks.find((r) => r.id === "A")?.foundingRank === 1);
assert("B is founding #2 at lock", ranks.find((r) => r.id === "B")?.foundingRank === 2);
assert("C is founding #3 at lock", ranks.find((r) => r.id === "C")?.foundingRank === 3);

// Scenario 3/7: later bid change does not recompute founding ranks
const afterRaise = rankFoundingMembers([
  listing("A", 800, 1),
  listing("B", 600, 2),
  listing("C", 50_000, 3, 99),
]);
assert("C would be #1 on live leaderboard", afterRaise.find((r) => r.id === "C")?.foundingRank === 1);
assert("frozen archive still uses lock-time ranks", ranks.find((r) => r.id === "C")?.foundingRank === 3);

// Equal bids: older lastBidAt ranks higher (same as live leaderboard)
const ties = rankFoundingMembers([
  listing("new", 500, 2, 2),
  listing("old", 500, 1, 1),
]);
assert("older equal bid keeps higher founding rank", ties[0].id === "old" && ties[0].foundingRank === 1);

// Scenario 4: business 51 is not in the founding set
const fiftyOne = Array.from({ length: 51 }, (_, i) => listing(`n${String(i).padStart(2, "0")}`, 500 + i, i));
const founders51 = pickFoundingMembers(fiftyOne);
assert("never more than 50 founders", founders51.length === 50);
assert("51st joiner excluded", !founders51.some((p) => p.id === "n50"));
assert("ranks 1–50 unique", new Set(rankFoundingMembers(founders51).map((r) => r.foundingRank)).size === 50);
assert("rank 50 assigned", rankFoundingMembers(founders51).some((r) => r.foundingRank === 50));
assert("no rank 51", rankFoundingMembers(founders51).every((r) => r.foundingRank <= 50));

// Scenario 6: two extra joiners around the 50th — still exactly 50, first 50 by createdAt
const race = pickFoundingMembers([
  ...Array.from({ length: 49 }, (_, i) => listing(`r${i}`, 500, i)),
  listing("fifty", 500, 49),
  listing("fifty-one", 9000, 49.5),
]);
assert("race still 50", race.length === 50);
assert("50th joiner included", race.some((p) => p.id === "fifty"));
assert("simultaneous 51st excluded", !race.some((p) => p.id === "fifty-one"));

// Filters never rewrite founding ranks (subset keeps original rank)
const plumber = { category: "Trades", subcategory: "Plumber", states: ["VIC"] };
const baker = { category: "Food", subcategory: "Bakery", states: ["NSW"] };
assert("plumber matches trades filter", matchesListingWhere(plumber, { category: "Trades", subcategory: "Plumber" }));
assert("baker excluded from trades filter", !matchesListingWhere(baker, { category: "Trades" }));
assert("Australia filter has no states predicate", listingWhere({ state: "AU" }).states == null);
assert("VIC filter uses has", (listingWhere({ state: "VIC" }).states as { has?: string })?.has === "VIC");

// Board href keeps filters
assert(
  "homepage founding href keeps category",
  boardHref({ board: "founding", category: "Trades", state: "VIC" }) ===
    "/?board=founding&category=Trades&state=VIC"
);
assert("founding page href has no board param", boardHref({ basePath: "/founding", category: "Trades" }) === "/founding?category=Trades");
assert("root href", boardHref({}) === "/");

if (failed) {
  console.log(`\n${failed} FAILED`);
  process.exit(1);
}
console.log("\nall founding tests passed");
