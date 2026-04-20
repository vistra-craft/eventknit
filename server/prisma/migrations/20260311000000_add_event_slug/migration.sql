-- Add slug column to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill slugs for existing events from their titles
-- Uses regexp_replace to: lowercase, replace non-alphanumeric with hyphens, collapse multiple hyphens, trim leading/trailing hyphens
UPDATE "Event"
SET "slug" = CONCAT(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(TRIM("title")), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  ),
  '-',
  SUBSTRING("id", 1, 8)
)
WHERE "slug" IS NULL;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event"("slug");
