-- Fill NULL creditDays with a default value
UPDATE "Customer" SET "creditDays" = 15 WHERE "creditDays" IS NULL;

