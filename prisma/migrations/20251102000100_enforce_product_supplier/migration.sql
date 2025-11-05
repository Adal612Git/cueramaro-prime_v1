-- Ensure all products have a supplier and enforce NOT NULL constraint

-- Create a default supplier if not exists
INSERT INTO "Supplier" ("id", "name", "createdAt", "updatedAt")
SELECT 'DEFAULT_SUPPLIER', 'PROVEEDOR GENERAL', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Supplier" WHERE "id" = 'DEFAULT_SUPPLIER');

-- Assign default supplier to products without one
UPDATE "Product" SET "supplierId" = 'DEFAULT_SUPPLIER' WHERE "supplierId" IS NULL;

-- Drop existing FK to change nullability and constraints
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_supplierId_fkey";

-- Make supplierId NOT NULL
ALTER TABLE "Product" ALTER COLUMN "supplierId" SET NOT NULL;

-- Recreate FK with RESTRICT on delete
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

