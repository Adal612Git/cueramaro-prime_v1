-- Add enums and columns for extended Supplier and Customer fields

DO $$ BEGIN
  CREATE TYPE "CreditTerms" AS ENUM ('contado', 'credito');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Suppliers: add common business/contact/credit fields
ALTER TABLE "Supplier"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "company" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "rfcCurp" TEXT,
  ADD COLUMN IF NOT EXISTS "creditTerms" "CreditTerms" DEFAULT 'contado',
  ADD COLUMN IF NOT EXISTS "creditDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- Customers: add common personal/business/contact/credit fields
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "businessName" TEXT,
  ADD COLUMN IF NOT EXISTS "personalAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "businessAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "rfcCurp" TEXT,
  ADD COLUMN IF NOT EXISTS "customerType" "CreditTerms" DEFAULT 'contado',
  ADD COLUMN IF NOT EXISTS "creditDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "authorizedPeople" JSONB,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

