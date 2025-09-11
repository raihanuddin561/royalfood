

BEGIN;

ALTER TABLE IF EXISTS "purchase_items"
  ADD COLUMN IF NOT EXISTS "receivedQuantity" double precision DEFAULT 0;

ALTER TABLE IF EXISTS "purchase_items"
  ADD COLUMN IF NOT EXISTS "lastReceivedAt" timestamptz;

COMMIT;

