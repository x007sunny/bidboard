import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MIN_BID_CENTS, MAX_BID_CENTS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { normalizeUrlOrHandle } from "@/lib/ranking";
import { fetchWebsiteMetadata, type WebsiteMetadata } from "@/lib/fetchWebsiteMetadata";
import { classifyListing } from "@/lib/classifyListing";
import type { ListingPreview } from "@/lib/listingPreview";

const bodySchema = z.object({
  url: z.string().min(1).max(500),
  amountCents: z.number().int().min(MIN_BID_CENTS).max(MAX_BID_CENTS),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    if (body.url.trim().startsWith("@")) {
      return NextResponse.json(
        { error: "Please enter a website, Facebook, or Instagram URL — not an @handle." },
        { status: 400 }
      );
    }

    const { uniqueKey, title: domainTitle, isHandle } = normalizeUrlOrHandle(body.url);
    if (isHandle) {
      return NextResponse.json(
        { error: "Please enter a website, Facebook, or Instagram URL — not an @handle." },
        { status: 400 }
      );
    }

    const lower = body.url.toLowerCase();
    if (
      lower.includes("telegram") ||
      lower.includes("whatsapp") ||
      lower.includes("discord.gg") ||
      lower.includes("t.me/")
    ) {
      return NextResponse.json(
        { error: "Chat and invite links are not allowed." },
        { status: 400 }
      );
    }

    const existing = await prisma.listing.findUnique({
      where: { uniqueKey },
      select: { bidCents: true, title: true, category: true, subcategory: true, states: true },
    });

    let fetched: WebsiteMetadata = {
      title: domainTitle,
      description: "",
      imageUrl: null,
      canonicalUrl: body.url.trim(),
      scraped: false,
    };
    try {
      fetched = await fetchWebsiteMetadata(body.url);
    } catch {
      // Preview must never crash because metadata fetch failed.
    }

    const title = fetched.title || domainTitle;
    const description = fetched.description || "";
    const logoUrl = fetched.imageUrl || "";
    const storedUrl = fetched.canonicalUrl || body.url.trim();

    const classified = classifyListing({
      title,
      description,
      url: storedUrl,
      signals: fetched.signals,
    });

    let category = classified.confident.category ? classified.category : "";
    let subcategory = classified.confident.subcategory ? classified.subcategory : null;
    let states = classified.states;
    let confident = classified.confident;

    // Raising an existing bid: fall back to current listing fields if detection is uncertain.
    if (existing && !confident.category && existing.category && existing.category !== "Other") {
      category = existing.category;
      subcategory = existing.subcategory;
      confident = { ...confident, category: true, subcategory: !!existing.subcategory };
    }
    if (existing && !confident.states && existing.states?.length) {
      states = existing.states;
      confident = { ...confident, states: true };
    }
    if (existing && (!title || title === domainTitle) && existing.title) {
      fetched.title = existing.title;
    }

    const preview: ListingPreview = {
      url: storedUrl,
      uniqueKey,
      title: fetched.title || existing?.title || domainTitle,
      description,
      logoUrl,
      category,
      subcategory,
      states,
      confident,
      scraped: !!fetched.scraped,
      existing: existing ? { bidCents: existing.bidCents } : null,
      amountCents: body.amountCents,
    };

    return NextResponse.json(preview);
  } catch (err: any) {
    console.error("Preview error:", err);
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
