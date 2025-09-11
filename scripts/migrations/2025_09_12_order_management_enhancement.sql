-- Order Management System Enhancement Migration
-- Date: 2025-09-12
-- Description: Add pre-order functionality, order tracking, and enhanced customer features

-- 1. Add pre-order fields to Order table
DO $$
BEGIN
  -- Add isPreOrder field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'isPreOrder') THEN
    ALTER TABLE "orders" ADD COLUMN "isPreOrder" BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add scheduledDate field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'scheduledDate') THEN
    ALTER TABLE "orders" ADD COLUMN "scheduledDate" TIMESTAMPTZ NULL;
  END IF;

  -- Add scheduledTime field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'scheduledTime') THEN
    ALTER TABLE "orders" ADD COLUMN "scheduledTime" TEXT NULL;
  END IF;
END $$;

-- 2. Update OrderStatus enum to include all necessary statuses
DO $$
BEGIN
  -- Check if the enum needs updating
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'OUT_FOR_DELIVERY' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
  ) THEN
    ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';
  END IF;
END $$;

-- 3. Create OrderTracking table for status history
CREATE TABLE IF NOT EXISTS "order_tracking" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for OrderTracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_tracking_orderId_fkey'
  ) THEN
    ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Add enhanced fields to Customer table
DO $$
BEGIN
  -- Add dateOfBirth field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'dateOfBirth') THEN
    ALTER TABLE "customers" ADD COLUMN "dateOfBirth" DATE NULL;
  END IF;

  -- Add preferences field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferences') THEN
    ALTER TABLE "customers" ADD COLUMN "preferences" TEXT NULL;
  END IF;
END $$;

-- 5. Add phone and address fields to User table
DO $$
BEGIN
  -- Add phone field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE "users" ADD COLUMN "phone" TEXT NULL;
  END IF;

  -- Add address field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE "users" ADD COLUMN "address" TEXT NULL;
  END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_isPreOrder_idx" ON "orders"("isPreOrder");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_scheduledDate_idx" ON "orders"("scheduledDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_tracking_orderId_idx" ON "order_tracking"("orderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_tracking_status_idx" ON "order_tracking"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_tracking_createdAt_idx" ON "order_tracking"("createdAt");

-- 7. Add initial order tracking entries for existing orders
INSERT INTO "order_tracking" ("id", "orderId", "status", "notes", "createdAt")
SELECT 
  'track_' || o."id" || '_initial',
  o."id",
  o."status",
  'Initial status from migration',
  o."createdAt"
FROM "orders" o
WHERE NOT EXISTS (
  SELECT 1 FROM "order_tracking" ot WHERE ot."orderId" = o."id"
)
ON CONFLICT ("id") DO NOTHING;

-- 8. Update table mapping for order_tracking
DO $$
BEGIN
  -- Update any existing mapping if needed
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_tracking') THEN
    -- Ensure the table mapping is correct
    COMMENT ON TABLE "order_tracking" IS 'Order status tracking history';
  END IF;
END $$;

COMMIT;
