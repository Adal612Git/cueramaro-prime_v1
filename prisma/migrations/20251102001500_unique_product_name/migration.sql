-- Enforce unique product name
-- 1) Deduplicate existing names by appending a short id suffix for rows with rn > 1
WITH dup AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "Product"
)
UPDATE "Product" AS p
SET "name" = p."name" || ' (DUP ' || SUBSTRING(p."id" FROM '.{6}$') || ')'
FROM dup
WHERE p."id" = dup."id" AND dup.rn > 1;

-- 2) Create unique constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_name_key'
  ) THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_name_key" UNIQUE ("name");
  END IF;
END $$;
