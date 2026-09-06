-- Paste this in Neon SQL Editor, then click Run.
-- Safe to run more than once.
-- Adds the Category table so Admin can add / edit / delete categories.
-- Default categories are filled in automatically the first time the site loads.

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subcategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Category_sortOrder_idx" ON "Category"("sortOrder");
