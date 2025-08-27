-- Add 'specification' column to items table (idempotent)
BEGIN;

ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS "specification" TEXT;

-- If Prisma generated name (camelCase) is used in DB, add that too (safe no-op if already exists)
ALTER TABLE IF EXISTS items ADD COLUMN IF NOT EXISTS "specification" TEXT;

COMMIT;
