-- Re-generate all event slugs using title-only format (no UUID suffix).
-- First event with a given title gets the clean slug.
-- Subsequent duplicates get -2, -3, etc. (ordered by createdAt).

WITH base_slugs AS (
  SELECT
    id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(TRIM("title")),
          '[^a-z0-9\s\-]', '', 'g'   -- remove special chars
        ),
        '\s+', '-', 'g'              -- spaces → hyphens
      ),
      '-+', '-', 'g'                 -- collapse multiple hyphens
    ) AS base_slug,
    "createdAt"
  FROM "Event"
  WHERE "deletedAt" IS NULL
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY base_slug
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM base_slugs
)
UPDATE "Event" e
SET "slug" = CASE
  WHEN r.rn = 1 THEN r.base_slug
  ELSE r.base_slug || '-' || r.rn
END
FROM ranked r
WHERE e.id = r.id;
