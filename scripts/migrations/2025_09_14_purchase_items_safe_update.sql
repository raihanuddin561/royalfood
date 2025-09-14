-- Purchase Item Enhancement Migration (Safe Update)
-- Date: 2025-09-14
-- Description: Safely add receivedQuantity and lastReceivedAt columns if missing
-- This avoids checksum conflicts with previously applied migrations

DO $$
BEGIN
  -- Add receivedQuantity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_items' AND column_name = 'receivedQuantity'
  ) THEN
    ALTER TABLE "purchase_items" ADD COLUMN "receivedQuantity" DOUBLE PRECISION DEFAULT 0;
    RAISE NOTICE 'Added receivedQuantity column to purchase_items';
  ELSE
    RAISE NOTICE 'receivedQuantity column already exists in purchase_items';
  END IF;

  -- Add lastReceivedAt column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_items' AND column_name = 'lastReceivedAt'
  ) THEN
    ALTER TABLE "purchase_items" ADD COLUMN "lastReceivedAt" TIMESTAMPTZ;
    RAISE NOTICE 'Added lastReceivedAt column to purchase_items';
  ELSE
    RAISE NOTICE 'lastReceivedAt column already exists in purchase_items';
  END IF;
END $$;