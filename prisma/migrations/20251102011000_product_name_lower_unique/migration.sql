-- Deduplicate case-insensitive product names by appending a short suffix to later duplicates
WITH dup AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY lower(name) ORDER BY id) AS rn
  FROM "Product"
)
UPDATE "Product" p
SET "name" = p."name" || ' (DUP ' || SUBSTRING(p."id" FROM '.{6}$') || ')'
FROM dup
WHERE p."id" = dup."id" AND dup.rn > 1;

-- Create unique index on lower(name) if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Product_name_lower_unique'
  ) THEN
    CREATE UNIQUE INDEX "Product_name_lower_unique" ON "Product" (LOWER("name"));
  END IF;
END $$;

