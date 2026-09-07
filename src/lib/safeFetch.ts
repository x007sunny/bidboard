import { lookup } from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata.goog",
  "metadata.google.com",
]);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
export const DEFAULT_MAX_REDIRECTS = 5;

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^\d+$/.test(host)) return true;
  if (
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost") ||
    host.endsWith(".lan") ||
    host.endsWith(".home")
  ) {
    return true;
  }
  return false;
}

export function isBlockedIp(ip: string): boolean {
  let addr = ip.toLowerCase();
  if (addr.startsWith("::ffff:")) addr = addr.slice(7);

  if (net.isIPv4(addr)) {
    const parts = addr.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(addr)) {
    if (addr === "::" || addr === "::1") return true;
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true;
    if (addr.startsWith("fe80")) return true;
    if (addr.startsWith("ff")) return true;
    if (addr.startsWith("2001:db8")) return true;
    return false;
  }

  return true;
}

export async function assertPublicHttpUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }
  const host = url.hostname.replace(/\.+$/, "");
  if (!host) throw new Error("That website cannot be listed.");
  if (isBlockedHost(host)) throw new Error("That website cannot be listed.");
  if (net.isIP(host) && isBlockedIp(host)) {
    throw new Error("That website cannot be listed.");
  }

  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length) throw new Error("That website cannot be listed.");
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error("That website cannot be listed.");
    }
  }
}

/** Resolve a redirect Location against the current URL and validate it before any request. */
export async function assertPublicRedirect(current: URL, location: string): Promise<URL> {
  let next: URL;
  try {
    next = new URL(location, current);
  } catch {
    throw new Error("That website cannot be listed.");
  }
  await assertPublicHttpUrl(next);
  return next;
}

type SafeFetchInit = RequestInit & {
  timeoutMs?: number;
  maxRedirects?: number;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function safeFetch(
  input: string | URL,
  init: SafeFetchInit = {},
  fetchImpl: FetchLike = fetch
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 15000;
  const maxRedirects = init.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const { timeoutMs: _t, maxRedirects: _m, redirect: _r, signal: _s, ...rest } = init;

  let current = typeof input === "string" ? new URL(input) : new URL(input.toString());
  await assertPublicHttpUrl(current);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hops = 0; hops <= maxRedirects; hops++) {
      const res = await fetchImpl(current.toString(), {
        ...rest,
        redirect: "manual",
        signal: controller.signal,
      });

      if (REDIRECT_STATUSES.has(res.status)) {
        const location = res.headers.get("location");
        if (res.body) {
          try {
            await res.body.cancel();
          } catch {
            // ignore
          }
        }
        if (!location) throw new Error("That website cannot be listed.");
        if (hops === maxRedirects) {
          throw new Error("That website cannot be listed.");
        }
        // Validate the next hop BEFORE requesting it.
        current = await assertPublicRedirect(current, location);
        continue;
      }

      return res;
    }
    throw new Error("That website cannot be listed.");
  } finally {
    clearTimeout(timer);
  }
}
