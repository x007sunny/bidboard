export type SocialTarget = {
  kind: "facebook" | "instagram";
  handle: string;
  canonical: string;
};

const FB_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.com",
  "www.fb.com",
  "m.fb.com",
]);
const IG_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const IG_RESERVED = new Set(["p", "reel", "reels", "stories", "explore", "accounts", "legal", "direct", "tv"]);
const FB_RESERVED = new Set([
  "login",
  "sharer",
  "watch",
  "reel",
  "reels",
  "groups",
  "events",
  "marketplace",
  "privacy",
  "help",
  "policies",
  "share",
  "dialog",
  "photo",
  "videos",
  "permalink.php",
]);

export function parseSocialUrl(input: string | URL): SocialTarget | null {
  let url: URL;
  try {
    url = input instanceof URL ? input : new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (FB_HOSTS.has(host)) {
    const id = url.searchParams.get("id");
    if (url.pathname.startsWith("/profile.php") && id) {
      return {
        kind: "facebook",
        handle: id,
        canonical: `https://www.facebook.com/profile.php?id=${encodeURIComponent(id)}`,
      };
    }
    const pages = url.pathname.match(/^\/pages\/[^/]+\/(\d+)\/?$/i);
    if (pages) {
      return { kind: "facebook", handle: pages[1], canonical: `https://www.facebook.com/${pages[1]}` };
    }
    const people = url.pathname.match(/^\/people\/[^/]+\/(\d+)\/?$/i);
    if (people) {
      return { kind: "facebook", handle: people[1], canonical: `https://www.facebook.com/${people[1]}` };
    }
    const slug = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean)[0];
    if (!slug || FB_RESERVED.has(slug.toLowerCase())) return null;
    return { kind: "facebook", handle: slug, canonical: `https://www.facebook.com/${slug}` };
  }

  if (IG_HOSTS.has(host)) {
    const slug = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean)[0];
    if (!slug || IG_RESERVED.has(slug.toLowerCase())) return null;
    if (!/^[A-Za-z0-9._]+$/.test(slug)) return null;
    return {
      kind: "instagram",
      handle: slug,
      canonical: `https://www.instagram.com/${slug}/`,
    };
  }

  return null;
}

function decode(text: string) {
  return text
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&#xb7;/gi, "·")
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  const value = m?.[1] || m?.[2];
  return value ? decode(value) : null;
}

function facebookIntro(ogDescription: string, pageName: string): string {
  const wereHere = ogDescription.match(/were here\.\s*(.+)$/i);
  if (wereHere?.[1]) return wereHere[1].trim();
  const parts = ogDescription.split("·").map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && !/likes|talking about|were here|followers/i.test(last) && last.length < 180) {
    return last.replace(new RegExp("^" + pageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[,.\\s]*", "i"), "").trim() || last;
  }
  return "";
}

function withSuffix(name: string, suffix: string) {
  const cleaned = name.replace(new RegExp(`\\s*[-–—|]\\s*${suffix}$`, "i"), "").trim();
  return `${cleaned} - ${suffix}`;
}

async function fetchHtml(url: string, extra: Record<string, string> = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json",
      "Accept-Language": "en-AU,en;q=0.9",
      "User-Agent":
        extra["User-Agent"] ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      ...extra,
    },
  });
  return res.text();
}

async function fetchFacebook(target: SocialTarget) {
  const graphPic = `https://graph.facebook.com/${encodeURIComponent(target.handle)}/picture?type=large`;
  let title = withSuffix(target.handle.replace(/[._]+/g, " "), "Facebook Page");
  let description = "";
  let imageUrl = graphPic;

  try {
    const aboutUrl = `${target.canonical.replace(/\/$/, "")}/about`;
    const html = await fetchHtml(aboutUrl, {
      "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    });
    const ogTitle = meta(html, "og:title");
    const ogDesc = meta(html, "og:description");
    const ogImage = meta(html, "og:image");
    if (ogTitle && !/log in|sign up|facebook/i.test(ogTitle)) {
      const name = ogTitle.split("|")[0].trim();
      title = withSuffix(name, "Facebook Page");
      if (ogDesc) description = facebookIntro(ogDesc, name);
    }
    if (ogImage && /^https?:\/\//i.test(ogImage) && !/static\.xx\.fbcdn|facebook\.com\/images/i.test(ogImage)) {
      imageUrl = ogImage;
    }
  } catch {
    // graph picture still used
  }

  if (!description) description = "Facebook page";

  return {
    title,
    description,
    imageUrl: `/api/avatar?fb=${encodeURIComponent(target.handle)}`,
    canonicalUrl: target.canonical,
  };
}

function parseInstagramEmbed(html: string): {
  username?: string;
  fullName?: string;
  pic?: string;
  followers?: number;
  bio?: string;
} {
  const m = html.match(/"contextJSON":"((?:\\.|[^"\\])*)"/);
  if (!m) return {};
  try {
    const inner = JSON.parse(`"${m[1]}"`);
    const obj = typeof inner === "string" ? JSON.parse(inner) : inner;
    const ctx = obj.context || obj;
    let pic = typeof ctx.profile_pic_url === "string" ? ctx.profile_pic_url : "";
    pic = pic.replace(/\\\//g, "/");
    const bioMatch = html.match(/"biography":"((?:\\.|[^"\\])*)"/);
    let bio = ctx.biography || ctx.bio || "";
    if (!bio && bioMatch) {
      try {
        bio = JSON.parse(`"${bioMatch[1]}"`);
      } catch {
        bio = bioMatch[1];
      }
    }
    return {
      username: ctx.username,
      fullName: ctx.full_name,
      pic,
      followers: ctx.followers_count,
      bio: typeof bio === "string" ? bio.replace(/\n+/g, " ").trim() : "",
    };
  } catch {
    return {};
  }
}

function decodeSearchHtml(html: string): string {
  return html
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&#xb7;/gi, "·")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function cleanIgBio(raw: string, handle: string): string {
  let s = raw
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/@\s+/g, "@")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/…+.*$/, "")
    .replace(/\.{3,}.*$/, "")
    .trim();
  s = s.replace(/^"+|"+$/g, "").replace(/\s+(For|And|To|With)$/i, "").trim();
  if (!s || s.length < 12) return "";
  if (/\d[\d,.]*\s+(Followers|Following|Posts)/i.test(s) && !/official Instagram|customer support/i.test(s)) {
    return "";
  }
  const handleRe = new RegExp(handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (!handleRe.test(s) && !/instagram page|customer support|official/i.test(s)) return "";
  if (/^official /i.test(s)) s = `The ${s}`;
  return s.slice(0, 280);
}

function extractInstagramBioFromText(text: string, handle: string): string {
  const handleRe = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`on Instagram:\\s*"([^"]{12,280})`, "i"),
    new RegExp(`(The official Instagram page for @${handleRe}[^"]{0,220})`, "i"),
    new RegExp(`(official Instagram page for @${handleRe}[^"]{0,220})`, "i"),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const cleaned = cleanIgBio(m[1], handle);
      if (cleaned) {
        return /^official/i.test(cleaned) ? `The ${cleaned.replace(/^the\s+/i, "")}` : cleaned;
      }
    }
  }
  return "";
}

async function fetchInstagramBioFromSearch(handle: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const headers = {
    Accept: "text/html",
    "Accept-Language": "en-AU,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };
  try {
    const bing = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(`site:instagram.com/${handle}`)}`,
      { signal: controller.signal, headers }
    );
    const bio = extractInstagramBioFromText(decodeSearchHtml(await bing.text()), handle);
    if (bio) return bio;

    const ddg = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:instagram.com/${handle}`)}`,
      { signal: controller.signal, headers }
    );
    return extractInstagramBioFromText(decodeSearchHtml(await ddg.text()), handle);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function formatFollowers(n?: number) {
  if (!n || n < 1) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M followers`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K followers`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K followers`;
  return `${n.toLocaleString()} followers`;
}

function isGenericIgDescription(value: string) {
  return !value || /^(instagram page|facebook page)$/i.test(value) || /·\s*\d/.test(value);
}

async function fetchInstagram(target: SocialTarget) {
  const handle = target.handle;
  const title = withSuffix(handle, "Instagram Page");
  let fallback = "";
  let bio = "";

  try {
    const res = await fetch(`https://www.instagram.com/${handle}/embed/`, {
      redirect: "follow",
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0",
      },
    });
    const html = await res.text();
    const embed = parseInstagramEmbed(html);
    if (embed.bio) bio = embed.bio;
    if (embed.fullName) {
      const followers = formatFollowers(embed.followers);
      fallback = followers ? `${embed.fullName} · ${followers}` : embed.fullName;
    }
  } catch {
    // try other sources
  }

  if (!bio) {
    try {
      const api = await fetch(
        `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            Accept: "*/*",
            "x-ig-app-id": "936619743392459",
          },
        }
      );
      if (api.ok) {
        const json = await api.json();
        const user = json?.data?.user;
        if (user?.biography) bio = String(user.biography).replace(/\n+/g, " ").trim();
      }
    } catch {
      // search fallback
    }
  }

  if (!bio) {
    bio = await fetchInstagramBioFromSearch(handle);
  }

  const description = (bio || fallback || "Instagram page").slice(0, 280);
  return {
    title,
    description,
    imageUrl: `/api/avatar?ig=${encodeURIComponent(handle)}`,
    canonicalUrl: target.canonical,
  };
}

function cookieHeader(res: Response): string {
  const list =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
  return list
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

export async function downloadInstagramAvatar(
  handle: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const embedRes = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/embed/`, {
    redirect: "follow",
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0",
    },
  });
  const html = await embedRes.text();
  const cookies = cookieHeader(embedRes);
  const embed = parseInstagramEmbed(html);
  if (!embed.pic) return null;

  const img = await fetch(embed.pic, {
    redirect: "follow",
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0",
      Cookie: cookies,
      Referer: `https://www.instagram.com/${handle}/embed/`,
    },
  });
  if (!img.ok) return null;
  const contentType = img.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  const bytes = await img.arrayBuffer();
  if (bytes.byteLength < 400) return null;
  return { bytes, contentType };
}

export async function downloadFacebookAvatar(
  handle: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const img = await fetch(
    `https://graph.facebook.com/${encodeURIComponent(handle)}/picture?width=320&height=320`,
    {
      redirect: "follow",
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0",
      },
    }
  );
  if (!img.ok) return null;
  const contentType = img.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  const bytes = await img.arrayBuffer();
  if (bytes.byteLength < 400) return null;
  return { bytes, contentType };
}

function toDataUrl(file: { bytes: ArrayBuffer; contentType: string }) {
  return `data:${file.contentType};base64,${Buffer.from(file.bytes).toString("base64")}`;
}

export async function socialCardAssets(rawUrl: string): Promise<{
  title: string;
  description: string;
  imageUrl: string;
  imageDataUrl: string | null;
  canonicalUrl: string;
} | null> {
  const meta = await fetchSocialMetadata(rawUrl);
  if (!meta) return null;
  const target = parseSocialUrl(rawUrl);
  let imageDataUrl: string | null = null;
  if (target?.kind === "instagram") {
    const file = await downloadInstagramAvatar(target.handle).catch(() => null);
    if (file) imageDataUrl = toDataUrl(file);
  } else if (target?.kind === "facebook") {
    const file = await downloadFacebookAvatar(target.handle).catch(() => null);
    if (file) imageDataUrl = toDataUrl(file);
  }
  return { ...meta, imageDataUrl };
}

export async function resolveSocialImage(
  kind: "facebook" | "instagram",
  handle: string
): Promise<string | null> {
  if (kind === "facebook") {
    return `https://graph.facebook.com/${encodeURIComponent(handle)}/picture?width=320&height=320`;
  }
  return null;
}

export function socialAvatarSrc(rawUrl: string): string | null {
  const target = parseSocialUrl(rawUrl);
  if (!target) return null;
  return target.kind === "facebook"
    ? `/api/avatar?fb=${encodeURIComponent(target.handle)}`
    : `/api/avatar?ig=${encodeURIComponent(target.handle)}`;
}

export function socialAvatarFallbacks(rawUrl: string): string[] {
  const src = socialAvatarSrc(rawUrl);
  return src ? [src] : [];
}

export async function fetchSocialMetadata(rawUrl: string): Promise<{
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
} | null> {
  const target = parseSocialUrl(rawUrl);
  if (!target) return null;
  if (target.kind === "facebook") return fetchFacebook(target);
  return fetchInstagram(target);
}
