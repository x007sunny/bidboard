const FETCH_TIMEOUT_MS = 6000;
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
  const amp = "&" + "amp;";
  const quot = "&" + "quot;";
  const apos = "&" + "apos;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const nbsp = "&" + "nbsp;";
  return raw
    .replace(new RegExp(nbsp, "gi"), " ")
    .replace(new RegExp(amp, "gi"), "&")
    .replace(new RegExp(quot, "gi"), '"')
    .replace(/&#39;/g, "'")
    .replace(new RegExp(apos, "gi"), "'")
    .replace(new RegExp(lt, "gi"), "<")
    .replace(new RegExp(gt, "gi"), ">")
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

function googleFaviconUrl(hostname: string): string {
  const host = hostname.replace(/^www\./i, "");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function isIco(url: string): boolean {
  return /\.ico(\?|$)/i.test(url) || /\/favicon\.ico/i.test(url);
}

function pickListingImage(
  pageUrl: URL,
  images: {
    appleIcon: string | null;
    favicon: string | null;
    ogImage: string | null;
    twitterImage: string | null;
  }
): string {
  // 44px card avatar: prefer square icons, skip broken .ico CDN wrappers
  const icons = [images.appleIcon, images.favicon].filter((u): u is string => !!u && !isIco(u));
  if (icons[0]) return icons[0];

  const photos = [images.ogImage, images.twitterImage].filter(
    (u): u is string => !!u && !isIco(u)
  );
  if (photos[0]) return photos[0];

  return googleFaviconUrl(pageUrl.hostname);
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

function jsonLdNameAndDescription(html: string): { name: string | null; description: string | null } {
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  let name: string | null = null;
  let description: string | null = null;
  for (const block of blocks) {
    const inner = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(inner);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const type = String(node["@type"] || "");
        if (!name && node.name && /organization|localbusiness|website|store/i.test(type + " " + (node.name || ""))) {
          name = String(node.name);
        }
        if (!name && node.name && type) name = String(node.name);
        if (!description && node.description) description = String(node.description);
      }
    } catch {
      // ignore invalid json-ld
    }
  }
  return { name, description };
}

function isChallengePage(html: string, title: string): boolean {
  const t = title.toLowerCase();
  if (t.includes("just a moment") || t.includes("attention required") || t === "access denied") {
    return true;
  }
  return /cf-browser-verification|challenge-platform|cdn-cgi\/challenge/i.test(html);
}

export async function fetchWebsiteMetadata(rawUrl: string): Promise<WebsiteMetadata> {
  const pageUrl = normalizeWebsiteUrl(rawUrl);
  const fallbackTitle = cleanedDomainName(pageUrl.hostname);
  const fallbackImage = googleFaviconUrl(pageUrl.hostname);
  const empty: WebsiteMetadata = {
    title: fallbackTitle,
    description: "",
    imageUrl: fallbackImage,
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
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    const html = await readHtml(res);
    if (!html) return empty;

    if (isChallengePage(html, titleTag(html) || "")) {
      return empty;
    }

    if (!res.ok) return empty;

    const contentType = res.headers.get("content-type") || "";
    if (/json|image|pdf|octet-stream|javascript/i.test(contentType) && !/html/i.test(contentType)) {
      return empty;
    }

    const ld = jsonLdNameAndDescription(html);
    const ogTitle = metaContent(html, ["og:title"]);
    const twitterTitle = metaContent(html, ["twitter:title"]);
    const htmlTitle = titleTag(html);
    const title =
      sanitizeText(
        ogTitle || twitterTitle || ld.name || htmlTitle || fallbackTitle,
        TITLE_MAX
      ) || fallbackTitle;

    if (isChallengePage(html, title)) return empty;

    const ogDesc = metaContent(html, ["og:description"]);
    const metaDesc = metaContent(html, ["description"]);
    const twitterDesc = metaContent(html, ["twitter:description"]);
    let description = sanitizeText(
      ogDesc || metaDesc || twitterDesc || ld.description || "",
      DESCRIPTION_MAX
    );
    if (!description) {
      description = pageTextFallback(html);
    }

    const ogImage = metaContent(html, ["og:image", "og:image:url"]);
    const twitterImage = metaContent(html, ["twitter:image", "twitter:image:src"]);
    const appleIcon = linkHref(html, ["apple-touch-icon", "apple-touch-icon-precomposed"]);
    const favicon = linkHref(html, ["icon", "shortcut icon"]);
    const imageUrl = pickListingImage(pageUrl, {
      appleIcon: toAbsolute(pageUrl, appleIcon),
      favicon: toAbsolute(pageUrl, favicon),
      ogImage: toAbsolute(pageUrl, ogImage),
      twitterImage: toAbsolute(pageUrl, twitterImage),
    });

    return {
      title,
      description,
      imageUrl: imageUrl || fallbackImage,
      canonicalUrl: pageUrl.toString(),
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

