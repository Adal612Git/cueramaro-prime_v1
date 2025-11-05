-- Add personal/business phone & whatsapp to Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phonePersonal" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "whatsappPersonal" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phoneBusiness" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "whatsappBusiness" TEXT;

