-- Non-destructive migration: add expiryDate and receivedDate to items
-- Run in a transaction. This script is safe to run multiple times.
BEGIN;

-- Add columns if not exists (Postgres: ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS expiry_date timestamptz NULL;
ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS received_date timestamptz NULL;

-- No backfill performed (preserve existing data). If you want to backfill from inventory_logs or other sources,
-- add UPDATE statements here carefully. For now we leave them NULL to avoid accidental changes.

COMMIT;
