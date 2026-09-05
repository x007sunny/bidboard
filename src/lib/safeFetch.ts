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

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
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
  if (url.port && !["", "80", "443", "8080", "8443"].includes(url.port)) {
    // unusual ports are fine for public sites; still resolve + IP-check below
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

type SafeFetchInit = RequestInit & {
  timeoutMs?: number;
  maxRedirects?: number;
};

export async function safeFetch(input: string | URL, init: SafeFetchInit = {}): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 15000;
  const { timeoutMs: _t, maxRedirects: _m, redirect: _r, signal: _s, ...rest } = init;

  const start = typeof input === "string" ? new URL(input) : new URL(input.toString());
  await assertPublicHttpUrl(start);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(start.toString(), {
      ...rest,
      redirect: "follow",
      signal: controller.signal,
    });
    try {
      const finalUrl = new URL(res.url || start.toString());
      await assertPublicHttpUrl(finalUrl);
    } catch {
      throw new Error("That website cannot be listed.");
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}
