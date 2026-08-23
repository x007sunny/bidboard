import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
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
      await prisma.$transaction(async (tx) => {
        // Mark payment completed
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
          // Raise existing listing
          await tx.listing.update({
            where: { id: existingId },
            data: {
              bidCents: newBidCents,
              description: meta.description || undefined,
              category: meta.category || undefined,
              lastBidAt: new Date(),
            },
          });

          // Fix the temporary listingId if needed
          if (payment.listingId === "pending") {
            await tx.payment.update({
              where: { id: payment.id },
              data: { listingId: existingId },
            });
          }
        } else {
          // Create new listing
          const listing = await tx.listing.create({
            data: {
              uniqueKey: meta.uniqueKey,
              url: meta.url || meta.uniqueKey,
              title: meta.title,
              description: meta.description || "",
              category: meta.category || "Other",
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
      // Still return 200 so Stripe doesn't retry forever on logic errors
    }
  }

  return NextResponse.json({ received: true });
}
