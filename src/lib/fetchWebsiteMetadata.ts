const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;
const TITLE_MAX = 140;
const DESCRIPTION_MAX = 280;

export type WebsiteMetadata = {
  title: string;
  description: string;
  imageUrl: string | null;
  canonicalUrl: string;
};

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    return true;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export function normalizeWebsiteUrl(input: string): URL {
  let cleaned = input.trim();
  if (!cleaned) throw new Error("Please enter a website URL.");
  if (cleaned.startsWith("@")) throw new Error("Please enter a website URL, not an @handle.");
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `https://${cleaned}`;

  const url = new URL(cleaned);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("That website cannot be listed.");
  }
  url.hash = "";
  return url;
}

function decodeEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"/gi, '"')
    .replace(/&#39;|'/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      if (!code || code < 32) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      if (!code || code < 32) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    });
}

function sanitizeText(raw: string, max: number): string {
  const withoutTags = raw.replace(/<[^>]*>/g, " ");
  const decoded = decodeEntities(withoutTags);
  const cleaned = decoded.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const sliced = cleaned.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim();
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  const value = m[1] ?? m[2] ?? m[3] ?? "";
  return decodeEntities(value).trim() || null;
}

function metaContent(html: string, keys: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const key of keys) {
    const needle = key.toLowerCase();
    for (const tag of tags) {
      const name = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
      if (name === needle) {
        const content = attr(tag, "content");
        if (content) return content;
      }
    }
  }
  return null;
}

function linkHref(html: string, rels: string[]): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const wanted = new Set(rels.map((r) => r.toLowerCase()));
  for (const tag of tags) {
    const rel = (attr(tag, "rel") || "").toLowerCase().split(/\s+/);
    if (rel.some((r) => wanted.has(r))) {
      const href = attr(tag, "href");
      if (href) return href;
    }
  }
  return null;
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return m[1];
}

function toAbsolute(base: URL, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null;
  const value = maybeRelative.trim();
  if (!value || value.startsWith("data:") || value.startsWith("javascript:")) return null;
  try {
    const resolved = new URL(value, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    if (isBlockedHost(resolved.hostname)) return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

function cleanedDomainName(hostname: string): string {
  const host = hostname.replace(/^www\./i, "");
  const label = host.split(".")[0] || host;
  const spaced = label.replace(/[-_]+/g, " ").trim();
  if (!spaced) return host;
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

function pageTextFallback(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");
  const pMatch = withoutNoise.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const source = pMatch ? pMatch[1] : withoutNoise.replace(/<[^>]*>/g, " ");
  return sanitizeText(source, DESCRIPTION_MAX);
}

async function readHtml(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return text.slice(0, MAX_HTML_BYTES);
  }
  const decoder = new TextDecoder("utf-8");
  let html = "";
  let bytes = 0;
  while (bytes < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    html += decoder.decode(value, { stream: true });
  }
  try {
    await reader.cancel();
  } catch {
    // ignore
  }
  html += decoder.decode();
  return html;
}

export async function fetchWebsiteMetadata(rawUrl: string): Promise<WebsiteMetadata> {
  const pageUrl = normalizeWebsiteUrl(rawUrl);
  const fallbackTitle = cleanedDomainName(pageUrl.hostname);
  const empty: WebsiteMetadata = {
    title: fallbackTitle,
    description: "",
    imageUrl: null,
    canonicalUrl: pageUrl.toString(),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(pageUrl.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; BidboardBot/1.0; +https://bidboard.com.au)",
      },
    });

    if (!res.ok) return empty;

    const contentType = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType) && contentType) {
      // still try if content-type is missing/odd, skip obvious non-html
      if (/json|image|pdf|octet-stream|javascript/i.test(contentType)) return empty;
    }

    const html = await readHtml(res);
    if (!html) return empty;

    const ogTitle = metaContent(html, ["og:title"]);
    const twitterTitle = metaContent(html, ["twitter:title"]);
    const htmlTitle = titleTag(html);
    const title =
      sanitizeText(ogTitle || twitterTitle || htmlTitle || fallbackTitle, TITLE_MAX) ||
      fallbackTitle;

    const ogDesc = metaContent(html, ["og:description"]);
    const metaDesc = metaContent(html, ["description"]);
    const twitterDesc = metaContent(html, ["twitter:description"]);
    let description = sanitizeText(ogDesc || metaDesc || twitterDesc || "", DESCRIPTION_MAX);
    if (!description) {
      description = pageTextFallback(html);
    }

    const ogImage = metaContent(html, ["og:image", "og:image:url"]);
    const twitterImage = metaContent(html, ["twitter:image", "twitter:image:src"]);
    const appleIcon = linkHref(html, ["apple-touch-icon", "apple-touch-icon-precomposed"]);
    const favicon = linkHref(html, ["icon", "shortcut icon", "apple-touch-icon"]);
    const imageUrl =
      toAbsolute(pageUrl, ogImage) ||
      toAbsolute(pageUrl, twitterImage) ||
      toAbsolute(pageUrl, appleIcon) ||
      toAbsolute(pageUrl, favicon);

    return {
      title,
      description,
      imageUrl,
      canonicalUrl: pageUrl.toString(),
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}
