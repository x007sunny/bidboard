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
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeHandle(handle: string) {
  if (/^\d+$/.test(handle)) return handle;
  return handle
    .replace(/[._]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

async function fetchFacebook(target: SocialTarget) {
  const picture = `https://graph.facebook.com/${encodeURIComponent(target.handle)}/picture?type=large`;
  let title = humanizeHandle(target.handle);
  let description = "Facebook page";

  try {
    const plugin = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
      target.canonical
    )}&tabs=about&width=340&height=700&small_header=false&_fb_noscript=1`;
    const res = await fetch(plugin, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-AU,en;q=0.9",
      },
    });
    const html = await res.text();
    const lines = stripTags(html).filter(
      (l) => !/^(facebook|follow page|followed|share|like page|verified page)$/i.test(l)
    );
    const name = lines.find((l) => l.length > 1 && l.length < 80 && !/followers|likes/i.test(l));
    if (name) title = decode(name);
    const followers = lines.find((l) => /\d[\d,.]*\s+(followers|likes)/i.test(l));
    const about = lines.find(
      (l) => l.length > 40 && !/followers|likes|follow page/i.test(l) && l !== name
    );
    if (about) description = decode(about).slice(0, 280);
    else if (followers) description = `Facebook page · ${followers}`;
  } catch {
    // Graph picture still used
  }

  return {
    title,
    description,
    imageUrl: picture,
    canonicalUrl: target.canonical,
  };
}

async function fetchInstagram(target: SocialTarget) {
  const handle = target.handle;
  let title = `@${handle}`;
  let description = `Instagram · @${handle}`;
  let imageUrl = `https://unavatar.io/instagram/${encodeURIComponent(handle)}`;

  try {
    const res = await fetch(target.canonical, {
      redirect: "follow",
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
        "Accept-Language": "en",
      },
    });
    const html = await res.text();
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
    const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1];
    const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];
    if (ogTitle && !/^instagram$/i.test(ogTitle)) title = decode(ogTitle);
    if (ogDesc) description = decode(ogDesc).slice(0, 280);
    if (ogImage && /^https?:\/\//i.test(ogImage)) imageUrl = ogImage;
  } catch {
    // keep username fallbacks
  }

  return {
    title,
    description,
    imageUrl,
    canonicalUrl: target.canonical,
  };
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
