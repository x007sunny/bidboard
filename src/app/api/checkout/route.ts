import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, MIN_BID_CENTS, MAX_BID_CENTS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { normalizeUrlOrHandle } from "@/lib/ranking";
import { fetchWebsiteMetadata, type WebsiteMetadata } from "@/lib/fetchWebsiteMetadata";
import { formatStatesMeta, validateTaxonomy } from "@/lib/categories";

const bodySchema = z.object({
  url: z.string().min(1).max(500),
  title: z.string().min(1).max(140),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().min(1).max(80),
  states: z.array(z.string()).min(1),
  amountCents: z.number().int().min(MIN_BID_CENTS).max(MAX_BID_CENTS),
});

function stripeSafe(value: string, max = 490): string {
  return value.replace(/[\u0000-\u001f]/g, "").slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const taxonomy = validateTaxonomy({
      category: body.category,
      subcategory: body.subcategory,
      states: body.states,
    });
    if (!taxonomy.ok) {
      return NextResponse.json({ error: taxonomy.error }, { status: 400 });
    }

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
    });

    let amountToCharge = body.amountCents;

    if (existing) {
      if (body.amountCents <= existing.bidCents) {
        return NextResponse.json(
          {
            error: `You must bid at least $1 more than your current bid of $${(existing.bidCents / 100).toFixed(0)}.`,
          },
          { status: 400 }
        );
      }
      amountToCharge = body.amountCents - existing.bidCents;
    } else {
      if (body.amountCents < MIN_BID_CENTS) {
        return NextResponse.json(
          { error: "Minimum bid is $5 AUD." },
          { status: 400 }
        );
      }
    }

    let fetched: WebsiteMetadata = {
      title: domainTitle,
      description: "",
      imageUrl: null,
      canonicalUrl: body.url.trim(),
    };
    try {
      fetched = await fetchWebsiteMetadata(body.url);
    } catch {
      // Listing submission must never fail because metadata fetch failed.
    }

    const title = body.title.trim() || fetched.title || domainTitle;
    const description = body.description?.trim() || fetched.description || "";
    const logoUrl = fetched.imageUrl || "";
    const storedUrl = fetched.canonicalUrl || body.url.trim();

    const payment = await prisma.payment.create({
      data: {
        listingId: existing?.id ?? null,
        stripeSessionId: `temp_${Date.now()}`,
        amountCents: amountToCharge,
        previousBidCents: existing?.bidCents ?? null,
        newBidCents: body.amountCents,
        status: "pending",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: `Get ${title} on the board`,
              description: existing
                ? `Increase bid from $${(existing.bidCents / 100).toFixed(0)} to $${(body.amountCents / 100).toFixed(0)}`
                : "Listing on bidboard.com.au",
            },
            unit_amount: amountToCharge,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?cancelled=1`,
      metadata: {
        paymentId: payment.id,
        uniqueKey: stripeSafe(uniqueKey),
        title: stripeSafe(title),
        description: stripeSafe(description),
        category: stripeSafe(taxonomy.category, 100),
        logoUrl: stripeSafe(logoUrl),
        newBidCents: String(body.amountCents),
        isHandle: "false",
        url: stripeSafe(storedUrl),
        existingListingId: existing?.id ?? "",
        subcategory: stripeSafe(taxonomy.subcategory, 80),
        states: stripeSafe(formatStatesMeta(taxonomy.states), 80),
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
