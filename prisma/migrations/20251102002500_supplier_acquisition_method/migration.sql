-- Add acquisitionMethod enum and column to Supplier
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AcquisitionMethod') THEN
    CREATE TYPE "AcquisitionMethod" AS ENUM ('punto_recoleccion', 'entrega_domicilio');
  END IF;
END $$;

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "acquisitionMethod" "AcquisitionMethod";

