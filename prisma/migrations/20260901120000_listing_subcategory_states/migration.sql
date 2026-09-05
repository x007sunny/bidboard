-- Subcategory + Australian states (multi-value). Existing rows stay valid.

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "states" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Listing_category_subcategory_idx" ON "Listing"("category", "subcategory");
CREATE INDEX IF NOT EXISTS "Listing_states_gin_idx" ON "Listing" USING GIN ("states");
