-- Add finalAmount column to orders table if it doesn't exist
ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Update existing orders to set finalAmount = totalAmount
UPDATE "orders" 
SET "finalAmount" = "totalAmount" 
WHERE "finalAmount" = 0 OR "finalAmount" IS NULL;