-- Safe migration: add receivedQuantity and lastReceivedAt to purchase_items
-- This file is idempotent (uses IF NOT EXISTS) so it can be applied multiple times.

BEGIN;

-- Add numeric column for received quantity (matches Prisma field `receivedQuantity`)
ALTER TABLE IF EXISTS "purchase_items"
  ADD COLUMN IF NOT EXISTS "receivedQuantity" double precision DEFAULT 0;

-- Add timestamp column for last received time
ALTER TABLE IF EXISTS "purchase_items"
  ADD COLUMN IF NOT EXISTS "lastReceivedAt" timestamptz;

COMMIT;

-- Notes:
-- - This migration only adds columns. It does not modify existing application logic.
-- - If you also want to initialize receivedQuantity for already-received purchases, run the helper
--   script `node scripts/set_received_quantity.js` or run SQL to set receivedQuantity = quantity for
--   appropriate rows.
