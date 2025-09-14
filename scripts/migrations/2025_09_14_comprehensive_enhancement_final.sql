-- Comprehensive Database Enhancement Migration (Final)
-- Date: 2025-09-14
-- Description: Safely apply all missing database enhancements without checksum conflicts
-- This migration is idempotent and can be safely re-run

DO $$
BEGIN
  RAISE NOTICE 'Starting comprehensive database enhancement migration...';

  -- 1. Purchase Items Enhancements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_items' AND column_name = 'receivedQuantity'
  ) THEN
    ALTER TABLE "purchase_items" ADD COLUMN "receivedQuantity" DOUBLE PRECISION DEFAULT 0;
    RAISE NOTICE 'Added receivedQuantity column to purchase_items';
  ELSE
    RAISE NOTICE 'receivedQuantity column already exists in purchase_items';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_items' AND column_name = 'lastReceivedAt'
  ) THEN
    ALTER TABLE "purchase_items" ADD COLUMN "lastReceivedAt" TIMESTAMPTZ;
    RAISE NOTICE 'Added lastReceivedAt column to purchase_items';
  ELSE
    RAISE NOTICE 'lastReceivedAt column already exists in purchase_items';
  END IF;

  -- 2. User Partner Nullable Enhancement
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'partnerId' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "partnerId" DROP NOT NULL;
    RAISE NOTICE 'Made partnerId nullable in users table';
  ELSE
    RAISE NOTICE 'partnerId is already nullable in users table';
  END IF;

  -- 3. Purchase Supplier Nullable Enhancement
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'supplierId' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "purchases" ALTER COLUMN "supplierId" DROP NOT NULL;
    RAISE NOTICE 'Made supplierId nullable in purchases table';
  ELSE
    RAISE NOTICE 'supplierId is already nullable in purchases table';
  END IF;

  -- 4. Ensure all critical indexes exist (safe operation)
  CREATE INDEX IF NOT EXISTS "purchase_items_receivedQuantity_idx" ON "purchase_items"("receivedQuantity");
  CREATE INDEX IF NOT EXISTS "purchase_items_lastReceivedAt_idx" ON "purchase_items"("lastReceivedAt");
  CREATE INDEX IF NOT EXISTS "users_partnerId_idx" ON "users"("partnerId");
  CREATE INDEX IF NOT EXISTS "purchases_supplierId_idx" ON "purchases"("supplierId");

  -- 5. Update any missing constraints safely
  DO $$
  BEGIN
    -- Add foreign key constraints if they don't exist (this is safe to retry)
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_partnerId_fkey' 
        AND table_name = 'users'
      ) THEN
        -- Only add if partners table exists and constraint doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
          ALTER TABLE "users" ADD CONSTRAINT "users_partnerId_fkey" 
          FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          RAISE NOTICE 'Added foreign key constraint for users.partnerId';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Foreign key constraint for users.partnerId already exists or cannot be added';
    END;

    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchases_supplierId_fkey' 
        AND table_name = 'purchases'
      ) THEN
        -- Only add if suppliers table exists and constraint doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
          ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" 
          FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          RAISE NOTICE 'Added foreign key constraint for purchases.supplierId';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Foreign key constraint for purchases.supplierId already exists or cannot be added';
    END;
  END $$;

  RAISE NOTICE 'Comprehensive database enhancement migration completed successfully!';
END $$;