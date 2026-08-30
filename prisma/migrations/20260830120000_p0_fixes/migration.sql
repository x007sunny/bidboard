-- P0 schema: Stripe event idempotency + real visitor tracking

CREATE TABLE IF NOT EXISTS "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Visitor" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Visitor_lastSeenAt_idx" ON "Visitor"("lastSeenAt");
