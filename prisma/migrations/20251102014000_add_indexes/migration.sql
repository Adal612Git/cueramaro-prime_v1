-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS "Sale_customerId_idx" ON "Sale" ("customerId");
CREATE INDEX IF NOT EXISTS "Sale_createdAt_idx" ON "Sale" ("createdAt");
CREATE INDEX IF NOT EXISTS "Sale_creditDueDate_idx" ON "Sale" ("creditDueDate");
CREATE INDEX IF NOT EXISTS "Payment_saleId_idx" ON "Payment" ("saleId");
CREATE INDEX IF NOT EXISTS "Expense_createdAt_idx" ON "Expense" ("createdAt");

