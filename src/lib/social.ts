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
    pic = pic.replace(/\\\//g, "/").replace("s100x100", "s320x320");
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

async function fetchInstagram(target: SocialTarget) {
  const handle = target.handle;
  let title = withSuffix(handle, "Instagram Page");
  let description = "";
  let imageUrl = "";

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
    if (embed.pic) imageUrl = `/api/avatar?ig=${encodeURIComponent(handle)}`;
    if (embed.bio) description = embed.bio;
  } catch {
    // try the JSON API next
  }

  try {
    const api = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "application/json",
          "X-IG-App-ID": "936619743392459",
          Referer: `https://www.instagram.com/${handle}/`,
        },
      }
    );
    if (api.ok) {
      const json = await api.json();
      const user = json?.data?.user;
      if (user) {
        if (user.biography) description = String(user.biography).replace(/\n+/g, " ").trim();
        imageUrl = `/api/avatar?ig=${encodeURIComponent(handle)}`;
      }
    }
  } catch {
    // keep embed data
  }

  return {
    title,
    description: (description || "Instagram page").slice(0, 280),
    imageUrl: `/api/avatar?ig=${encodeURIComponent(handle)}`,
    canonicalUrl: target.canonical,
  };
}

export async function resolveSocialImage(
  kind: "facebook" | "instagram",
  handle: string
): Promise<string | null> {
  if (kind === "facebook") {
    return `https://graph.facebook.com/${encodeURIComponent(handle)}/picture?width=320&height=320`;
  }

  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/embed/`, {
    redirect: "follow",
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0",
    },
  });
  const html = await res.text();
  const embed = parseInstagramEmbed(html);
  return embed.pic || null;
}

export function socialAvatarSrc(rawUrl: string): string | null {
  const target = parseSocialUrl(rawUrl);
  if (!target) return null;
  return target.kind === "facebook"
    ? `/api/avatar?fb=${encodeURIComponent(target.handle)}`
    : `/api/avatar?ig=${encodeURIComponent(target.handle)}`;
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
