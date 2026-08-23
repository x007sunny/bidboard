import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, MIN_BID_CENTS, MAX_BID_CENTS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { normalizeUrlOrHandle, getTopBidCents } from "@/lib/ranking";

const bodySchema = z.object({
  url: z.string().min(1).max(500),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  amountCents: z.number().int().min(MIN_BID_CENTS).max(MAX_BID_CENTS),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const { uniqueKey, title, isHandle } = normalizeUrlOrHandle(body.url);

    // Basic content filters (same spirit as original)
    const lower = body.url.toLowerCase() + " " + body.description.toLowerCase();
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
      // Raising existing listing – only pay the difference
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
      // New listing – enforce minimum
      if (body.amountCents < MIN_BID_CENTS) {
        return NextResponse.json(
          { error: "Minimum bid is $5 AUD." },
          { status: 400 }
        );
      }
    }

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        listingId: existing?.id ?? null, // will update after
        stripeSessionId: `temp_${Date.now()}`,
        amountCents: amountToCharge,
        previousBidCents: existing?.bidCents ?? null,
        newBidCents: body.amountCents,
        status: "pending",
      },
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: existing
                ? `Raise bid for ${title}`
                : `Bid for ${title} on bidboard.com.au`,
              description: existing
                ? `Increase bid from $${(existing.bidCents / 100).toFixed(0)} to $${(body.amountCents / 100).toFixed(0)}`
                : body.description.slice(0, 200),
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
        uniqueKey,
        title,
        description: body.description,
        category: body.category,
        newBidCents: String(body.amountCents),
        isHandle: String(isHandle),
        url: body.url,
        existingListingId: existing?.id ?? "",
      },
    });

    // Update payment with real session id
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
