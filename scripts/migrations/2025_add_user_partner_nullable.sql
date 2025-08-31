-- Migration: Add partnerId to users (nullable) and foreign key to partners(id)
-- Generated: 2025-08-31

BEGIN;

-- Add nullable partnerId column (text to match Prisma cuid() ids)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS "partnerId" TEXT;

-- Remove any existing FK with same name (safe to run multiple times)
ALTER TABLE IF EXISTS users
  DROP CONSTRAINT IF EXISTS users_partnerid_fkey;

-- Add foreign key constraint referencing partners(id)
ALTER TABLE IF EXISTS users
  ADD CONSTRAINT users_partnerid_fkey
  FOREIGN KEY ("partnerId") REFERENCES partners(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Index to speed up lookups by partner
CREATE INDEX IF NOT EXISTS idx_users_partnerId ON users("partnerId");

COMMIT;

-- Notes:
-- 1) Prisma schema must be updated to include `partnerId String?` and relation on User model.
-- 2) After adding this file, run your normal migration process (or apply this SQL directly) and then run `npx prisma generate` if using Prisma Client.
