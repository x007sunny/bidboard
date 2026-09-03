import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fetchWebsiteMetadata } from "@/lib/fetchWebsiteMetadata";
import { parseSocialUrl, socialCardAssets } from "@/lib/social";
import { classifyListing } from "@/lib/classifyListing";
import { parseStates } from "@/lib/categories";

export const runtime = "nodejs";

type LockedListing = {
  id: string;
  bidCents: number;
};

function isUniqueViolation(err: unknown, field?: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return false;
  }
  if (!field) return true;
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return true;
}

async function lockListing(
  tx: Prisma.TransactionClient,
  existingId: string | undefined,
  uniqueKey: string
): Promise<LockedListing | null> {
  if (existingId) {
    const byId = await tx.$queryRaw<LockedListing[]>`
      SELECT id, "bidCents" FROM "Listing" WHERE id = ${existingId} FOR UPDATE
    `;
    if (byId[0]) return byId[0];
  }
  const byKey = await tx.$queryRaw<LockedListing[]>`
    SELECT id, "bidCents" FROM "Listing" WHERE "uniqueKey" = ${uniqueKey} FOR UPDATE
  `;
  return byKey[0] ?? null;
}

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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata;

  if (!meta?.paymentId || !meta.uniqueKey) {
    console.error("Missing metadata on session", session.id);
    return NextResponse.json({ received: true });
  }

  let title = meta.title || "";
  let description = meta.description || "";
  let logoUrl = meta.logoUrl || "";
  let url = meta.url || "";
  let classified = classifyListing({
    category: meta.category || "Other",
    title,
    description,
    url,
  });
  if (meta.subcategory && !classified.subcategory) {
    classified = { ...classified, subcategory: meta.subcategory };
  }
  if (classified.states.length === 0) {
    classified = { ...classified, states: parseStates(meta.states) };
  }
  try {
    const social = parseSocialUrl(meta.url || meta.uniqueKey);
    if (social) {
      const fresh = await socialCardAssets(meta.url || meta.uniqueKey);
      if (fresh?.title) title = fresh.title;
      if (fresh?.description) description = fresh.description;
      if (fresh?.canonicalUrl) url = fresh.canonicalUrl;
      if (fresh?.imageDataUrl) logoUrl = fresh.imageDataUrl;
      else if (fresh?.imageUrl) logoUrl = fresh.imageUrl;
    } else {
      const fresh = await fetchWebsiteMetadata(meta.url || meta.uniqueKey);
      if (fresh.title) title = fresh.title;
      if (fresh.description) description = fresh.description;
      if (fresh.imageUrl) logoUrl = fresh.imageUrl;
      if (fresh.canonicalUrl) url = fresh.canonicalUrl;
      classified = classifyListing({
        category: meta.category || "Other",
        title,
        description,
        url,
        signals: fresh.signals,
      });
      if (!classified.subcategory && meta.subcategory) {
        classified = { ...classified, subcategory: meta.subcategory };
      }
      if (classified.states.length === 0) {
        classified = { ...classified, states: parseStates(meta.states) };
      }
    }
  } catch {
    // Stripe metadata is the fallback
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.stripeEvent.create({
          data: { id: event.id, type: event.type },
        });

        const payment = await tx.payment.findUnique({
          where: { id: meta.paymentId },
        });
        if (!payment) {
          throw new Error(`Payment not found: ${meta.paymentId}`);
        }
        if (payment.status === "completed") {
          return;
        }

        const existingId = meta.existingListingId || payment.listingId || "";
        const locked = await lockListing(tx, existingId || undefined, meta.uniqueKey);
        const paidCents = payment.amountCents;

        if (locked) {
          const current = await tx.listing.findUnique({
            where: { id: locked.id },
            select: { subcategory: true, states: true },
          });
          await tx.listing.update({
            where: { id: locked.id },
            data: {
              bidCents: locked.bidCents + paidCents,
              title: title || undefined,
              description: description || undefined,
              category: meta.category || undefined,
              logoUrl: logoUrl || undefined,
              url: url || undefined,
              lastBidAt: new Date(),
              ...(current?.subcategory
                ? {}
                : { subcategory: classified.subcategory || null }),
              ...(current?.states?.length
                ? {}
                : { states: classified.states }),
            },
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "completed",
              completedAt: new Date(),
              listingId: locked.id,
            },
          });
          return;
        }

        const listing = await tx.listing.create({
          data: {
            uniqueKey: meta.uniqueKey,
            url: url || meta.uniqueKey,
            title: title || meta.uniqueKey,
            description: description || "",
            category: meta.category || "Other",
            subcategory: classified.subcategory || null,
            states: classified.states,
            logoUrl: logoUrl || null,
            bidCents: paidCents,
            lastBidAt: new Date(),
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            listingId: listing.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    console.log("Successfully processed bid payment", meta.paymentId, event.id);
  } catch (err) {
    if (isUniqueViolation(err, "id")) {
      console.log("Duplicate Stripe event ignored", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Error processing webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
