-- Founding 50 lock + frozen archive. Safe to run more than once.

CREATE TABLE IF NOT EXISTS "FoundingLock" (
    "id" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundingLock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FoundingMember" (
    "id" TEXT NOT NULL,
    "foundingRank" INTEGER NOT NULL,
    "listingId" TEXT,
    "uniqueKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "states" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "bidCents" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastBidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundingMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FoundingMember_foundingRank_key" ON "FoundingMember"("foundingRank");
CREATE UNIQUE INDEX IF NOT EXISTS "FoundingMember_listingId_key" ON "FoundingMember"("listingId");
CREATE INDEX IF NOT EXISTS "FoundingMember_foundingRank_idx" ON "FoundingMember"("foundingRank");
CREATE INDEX IF NOT EXISTS "FoundingMember_category_subcategory_idx" ON "FoundingMember"("category", "subcategory");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FoundingMember_listingId_fkey'
    ) THEN
        ALTER TABLE "FoundingMember"
            ADD CONSTRAINT "FoundingMember_listingId_fkey"
            FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
