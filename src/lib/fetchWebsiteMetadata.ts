import { fetchSocialMetadata } from "./social";
import { isBlockedHost, safeFetch } from "./safeFetch";
import {
  extractHeadings,
  extractTextSample,
  parseJsonLdBlocks,
  type PageSignals,
} from "./classifyListing";

const FETCH_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 600_000;
const TITLE_MAX = 140;
const DESCRIPTION_MAX = 280;

export type WebsiteMetadata = {
  title: string;
  description: string;
  imageUrl: string | null;
  canonicalUrl: string;
  signals?: PageSignals;
};

const BOT_WALL_RE =
  /pardon our interruption|just a moment|attention required|as you were browsing|think you were a bot|you were a bot|checking your browser|cf-browser-verification|challenge-platform\/h\/|cdn-cgi\/challenge|_incapsula_resource|incapsula|verify you are (a )?human|unusual traffic from your computer/i;

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

function isChallengePage(html: string, title = "", description = ""): boolean {
  if (BOT_WALL_RE.test(`${title} ${description}`)) return true;
  const snippet = html.slice(0, 4000);
  return BOT_WALL_RE.test(snippet);
}

function isJunkText(text: string): boolean {
  return !!text && BOT_WALL_RE.test(text);
}

function isGenericTitle(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (/^(home|homepage|index|welcome|untitled|default|new page|page not found|404|home page)(\s*[\|–—:-].*)?$/.test(t)) {
    return true;
  }
  return false;
}

function usefulTitle(raw: string | null | undefined, max = TITLE_MAX): string | null {
  const t = sanitizeText(raw || "", max);
  if (!t || isGenericTitle(t) || isJunkText(t)) return null;
  if (/\b(logo|icon|sprite)\b$/i.test(t)) return null;
  return t;
}

function isPromoDescription(text: string): boolean {
  const s = text.trim().toLowerCase();
  if (s.length < 40) return true;
  if (/^(spend|save |off |buy \d|link your|sign up|subscribe|use code)/i.test(s)) return true;
  if (/participating product|limited time|promo code|click here/i.test(s)) return true;
  if (/traditional custodians|elders past|aboriginal and torres/i.test(s)) return true;
  if (/return policy|hours of operation|what is your phone|used to get facts/i.test(s)) return true;
  return false;
}

function usefulDescription(raw: string | null | undefined): string | null {
  const t = sanitizeText(raw || "", DESCRIPTION_MAX);
  if (!t || isJunkText(t) || isPromoDescription(t)) return null;
  return t;
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function jsonStringValues(html: string, keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const v = unescapeJsonString(m[1]).trim();
      if (v) out.push(v);
    }
  }
  return out;
}

function pickBestTitle(candidates: Array<string | null | undefined>): string | null {
  const list = [...new Set(candidates.map((c) => usefulTitle(c)).filter(Boolean))] as string[];
  if (list.length === 0) return null;
  const scored = list.map((t) => {
    let score = Math.min(t.length, 80);
    if (/[|–—]/.test(t)) score += 50;
    if (t.split(/\s+/).length >= 4) score += 20;
    if (t.length < 14) score -= 25;
    return { t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].t;
}

function pickBestDescription(candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    const t = usefulDescription(c);
    if (t) return t;
  }
  return "";
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
  let orgName: string | null = null;
  let pageName: string | null = null;
  let description: string | null = null;
  for (const block of blocks) {
    const inner = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(inner);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const type = String(node["@type"] || "");
        if (/BreadcrumbList|ListItem/i.test(type)) continue;
        const rawName = typeof node.name === "string" ? node.name : null;
        const name = usefulTitle(rawName);
        if (name && !orgName && /organization|localbusiness|store|plumber|electrician|company/i.test(type)) {
          orgName = name;
        }
        if (name && !orgName && /website/i.test(type)) {
          orgName = name;
        }
        if (name && !pageName && /webpage/i.test(type)) {
          pageName = name;
        }
        if (!description && typeof node.description === "string") {
          description = node.description;
        }
      }
    } catch {
      // ignore invalid json-ld
    }
  }
  return { name: orgName || pageName, description };
}

function pageSignals(html: string): PageSignals {
  return {
    jsonLd: parseJsonLdBlocks(html),
    headings: extractHeadings(html),
    textSample: extractTextSample(html),
  };
}

export async function fetchWebsiteMetadata(rawUrl: string): Promise<WebsiteMetadata> {
  const social = await fetchSocialMetadata(rawUrl).catch(() => null);
  if (social) return social;

  const pageUrl = normalizeWebsiteUrl(rawUrl);
  const fallbackTitle = cleanedDomainName(pageUrl.hostname);
  const fallbackImage = googleFaviconUrl(pageUrl.hostname);
  const empty: WebsiteMetadata = {
    title: fallbackTitle,
    description: "",
    imageUrl: fallbackImage,
    canonicalUrl: pageUrl.toString(),
  };

  try {
    const res = await safeFetch(pageUrl, {
      method: "GET",
      timeoutMs: FETCH_TIMEOUT_MS,
      maxRedirects: 3,
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
    const ogTitle = usefulTitle(metaContent(html, ["og:title"]));
    const twitterTitle = usefulTitle(metaContent(html, ["twitter:title"]));
    const htmlTitle = usefulTitle(titleTag(html));
    const siteName = usefulTitle(
      metaContent(html, ["og:site_name", "application-name", "apple-mobile-web-app-title"])
    );
    const jsonTitles = jsonStringValues(html, [
      "metaTitle",
      "seoTitle",
      "seo_title",
    ]);

    const title =
      pickBestTitle([
        ...jsonTitles,
        ogTitle,
        htmlTitle,
        twitterTitle,
        siteName,
        ld.name,
      ]) || fallbackTitle;

    const ogDesc = metaContent(html, ["og:description"]);
    const metaDesc = metaContent(html, ["description"]);
    const twitterDesc = metaContent(html, ["twitter:description"]);
    const jsonDescs = jsonStringValues(html, ["metaDescription", "seoDescription", "seo_description"]);
    const pairedSeo = html.match(
      /"metaTitle"\s*:\s*"(?:\\.|[^"\\])*"[\s\S]{0,500}?"description"\s*:\s*"((?:\\.|[^"\\])*)"/i
    );
    const pairedDesc = pairedSeo ? unescapeJsonString(pairedSeo[1]) : null;

    let description = pickBestDescription([
      pairedDesc,
      ...jsonDescs,
      metaDesc,
      ogDesc,
      twitterDesc,
      ld.description,
    ]);
    if (!description) {
      description = pageTextFallback(html);
      if (isPromoDescription(description) || isJunkText(description)) description = "";
    }

    if (isJunkText(description) || isChallengePage(html, title, description)) {
      return empty;
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
      signals: pageSignals(html),
    };
  } catch {
    return empty;
  }
}
