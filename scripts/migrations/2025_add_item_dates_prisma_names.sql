-- Add columns using exact Prisma field names (case-sensitive) so Prisma-generated SQL finds them
BEGIN;

ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS "expiryDate" timestamptz NULL;
ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS "receivedDate" timestamptz NULL;

COMMIT;
