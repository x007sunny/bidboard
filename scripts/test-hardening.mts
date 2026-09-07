import {
  assertPublicHttpUrl,
  assertPublicRedirect,
  isBlockedHost,
  isBlockedIp,
  safeFetch,
} from "../src/lib/safeFetch.ts";
import { listingWhere } from "../src/lib/listingWhere.ts";
import { validateTaxonomy, AU_NATIONAL } from "../src/lib/categories.ts";
import { MIN_BID_CENTS } from "../src/lib/stripe.ts";
import { isPlausibleVisitorId } from "../src/lib/visitors.ts";
import { tooManyRequests } from "../src/lib/rateLimit.ts";

let failed = 0;
function assert(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log("ok ", name);
    return;
  }
  failed += 1;
  console.log("FAIL", name, detail ?? "");
}

async function throws(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    assert(name, false, "expected throw");
  } catch {
    assert(name, true);
  }
}

assert("min bid $5", MIN_BID_CENTS === 500);

assert("block localhost host", isBlockedHost("localhost"));
assert("block 127.0.0.1 host", isBlockedHost("127.0.0.1"));
assert("block metadata host", isBlockedHost("metadata.google.internal"));
assert("allow example.com", !isBlockedHost("example.com"));

assert("block 127.0.0.1", isBlockedIp("127.0.0.1"));
assert("block 10.0.0.5", isBlockedIp("10.0.0.5"));
assert("block 192.168.1.9", isBlockedIp("192.168.1.9"));
assert("block 172.16.0.1", isBlockedIp("172.16.0.1"));
assert("block 169.254.169.254", isBlockedIp("169.254.169.254"));
assert("block ::1", isBlockedIp("::1"));
assert("allow 1.1.1.1", !isBlockedIp("1.1.1.1"));

await throws("url localhost", () => assertPublicHttpUrl(new URL("http://localhost/")));
await throws("url 127.0.0.1", () => assertPublicHttpUrl(new URL("http://127.0.0.1/secret")));
await throws("url 192.168", () => assertPublicHttpUrl(new URL("http://192.168.0.20/")));
await throws("url 10.x", () => assertPublicHttpUrl(new URL("http://10.1.2.3/")));
await throws("url 169.254", () => assertPublicHttpUrl(new URL("http://169.254.169.254/latest/meta-data/")));
await throws("url metadata host", () => assertPublicHttpUrl(new URL("http://metadata.google.internal/")));
await throws("url file", () => assertPublicHttpUrl(new URL("file:///etc/passwd")));

await throws("redirect to localhost", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "http://localhost/admin")
);
await throws("redirect to 127.0.0.1", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "http://127.0.0.1/")
);
await throws("redirect to 192.168", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "http://192.168.1.1/internal")
);
await throws("redirect to 10.x", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "https://10.0.0.8/")
);
await throws("redirect to 169.254", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "http://169.254.169.254/")
);
await throws("redirect to metadata", () =>
  assertPublicRedirect(new URL("https://example.com/go"), "http://metadata.google.internal/")
);

const httpsNext = await assertPublicRedirect(
  new URL("https://example.com/a"),
  "https://example.com/b"
);
assert("https→https location", httpsNext.href === "https://example.com/b");

const httpToHttps = await assertPublicRedirect(
  new URL("http://example.com/a"),
  "https://example.com/b"
);
assert("http→https location", httpToHttps.href === "https://example.com/b");

const fetched: string[] = [];
const fakeFetch = async (url: string) => {
  fetched.push(url);
  if (url === "https://example.com/start") {
    return new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1/steal" },
    });
  }
  throw new Error(`should not fetch ${url}`);
};

try {
  await safeFetch("https://example.com/start", { timeoutMs: 5000, maxRedirects: 5 }, fakeFetch);
  assert("ssrf redirect rejected", false, "safeFetch should throw");
} catch {
  assert("ssrf redirect rejected", true);
}
assert("ssrf never fetched private hop", !fetched.some((u) => u.includes("127.0.0.1")), fetched);

const hops: string[] = [];
const chain = async (url: string) => {
  hops.push(url);
  if (url === "https://example.com/1") {
    return new Response(null, { status: 301, headers: { location: "https://example.com/2" } });
  }
  if (url === "https://example.com/2") {
    return new Response(null, { status: 302, headers: { location: "https://example.com/3" } });
  }
  if (url === "https://example.com/3") {
    return new Response("ok", { status: 200 });
  }
  throw new Error(`unexpected ${url}`);
};
const chained = await safeFetch("https://example.com/1", { maxRedirects: 5 }, chain);
assert("multi redirect status", chained.status === 200);
assert("multi redirect hops", hops.join(">") === "https://example.com/1>https://example.com/2>https://example.com/3");

try {
  let n = 0;
  await safeFetch("https://example.com/loop", { maxRedirects: 5 }, async () => {
    n += 1;
    return new Response(null, {
      status: 302,
      headers: { location: "https://example.com/loop" },
    });
  });
  assert("redirect limit", false, `followed ${n}`);
} catch {
  assert("redirect limit", true);
}

const au = listingWhere({ state: AU_NATIONAL, category: "Restaurants" });
assert("Australia filter has no states predicate", !("states" in au));
assert("Australia still filters category", au.category === "Restaurants");
const vic = listingWhere({ state: "VIC", category: "Restaurants" });
assert("VIC uses has", (vic.states as { has: string }).has === "VIC");

const taxOk = validateTaxonomy({
  category: "Restaurants",
  subcategory: "Italian",
  states: ["VIC"],
});
assert("taxonomy ok", taxOk.ok === true);
const taxBad = validateTaxonomy({
  category: "NotACategory",
  subcategory: "Italian",
  states: ["VIC"],
});
assert("taxonomy rejects unknown category", taxBad.ok === false);

assert("visitor id uuid ok", isPlausibleVisitorId("11111111-2222-3333-4444-555555555555"));
assert("visitor id empty no", !isPlausibleVisitorId(""));
assert("visitor id short no", !isPlausibleVisitorId("abc"));

assert("rate limit first ok", tooManyRequests("t:a", 3, 60_000) === false);
assert("rate limit second ok", tooManyRequests("t:a", 3, 60_000) === false);
assert("rate limit third ok", tooManyRequests("t:a", 3, 60_000) === false);
assert("rate limit fourth blocked", tooManyRequests("t:a", 3, 60_000) === true);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall hardening tests passed");
