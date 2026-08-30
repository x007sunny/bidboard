import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fetchWebsiteMetadata } from "@/lib/fetchWebsiteMetadata";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata;

    if (!meta?.paymentId || !meta.uniqueKey) {
      console.error("Missing metadata on session", session.id);
      return NextResponse.json({ received: true });
    }

    try {
      let title = meta.title || "";
      let description = meta.description || "";
      let logoUrl = meta.logoUrl || "";
      let url = meta.url || "";
      try {
        const fresh = await fetchWebsiteMetadata(meta.url || meta.uniqueKey);
        if (fresh.title) title = fresh.title;
        if (fresh.description) description = fresh.description;
        if (fresh.imageUrl) logoUrl = fresh.imageUrl;
        if (fresh.canonicalUrl) url = fresh.canonicalUrl;
      } catch {
        // Stripe metadata is the fallback
      }

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: meta.paymentId },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });

        const newBidCents = parseInt(meta.newBidCents, 10);
        const existingId = meta.existingListingId;

        if (existingId) {
          await tx.listing.update({
            where: { id: existingId },
            data: {
              bidCents: newBidCents,
              title: title || undefined,
              description: description || undefined,
              category: meta.category || undefined,
              logoUrl: logoUrl || undefined,
              url: url || undefined,
              lastBidAt: new Date(),
            },
          });
        } else {
          const listing = await tx.listing.create({
            data: {
              uniqueKey: meta.uniqueKey,
              url: url || meta.uniqueKey,
              title: title || meta.uniqueKey,
              description: description || "",
              category: meta.category || "Other",
              logoUrl: logoUrl || null,
              bidCents: newBidCents,
              lastBidAt: new Date(),
            },
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: { listingId: listing.id },
          });
        }
      });

      console.log("Successfully processed bid payment", meta.paymentId);
    } catch (err) {
      console.error("Error processing webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}
