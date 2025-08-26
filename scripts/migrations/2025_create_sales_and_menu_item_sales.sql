-- Create Sales and Menu Item Sales tables (idempotent)
-- Safe to run multiple times; uses IF NOT EXISTS and exact Prisma-mapped column names
BEGIN;

-- Ensure enums exist (duplicate_object will be ignored)
DO $$ BEGIN
  CREATE TYPE IF NOT EXISTS "PaymentMethod" AS ENUM ('CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE IF NOT EXISTS "SaleStatus" AS ENUM ('COMPLETED', 'REFUNDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Sales table
CREATE TABLE IF NOT EXISTS "sales" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "saleNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "saleDate" TIMESTAMPTZ NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalAmount" DOUBLE PRECISION NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- Unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "sales_saleNumber_key" ON "sales"("saleNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orderId_key" ON "sales"("orderId");
CREATE INDEX IF NOT EXISTS "sales_userId_idx" ON "sales"("userId");

-- Foreign keys (if referenced tables exist)
DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT IF NOT EXISTS "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT IF NOT EXISTS "sales_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Menu item sales
CREATE TABLE IF NOT EXISTS "menu_item_sales" (
  "id" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "totalCost" DOUBLE PRECISION NOT NULL,
  "grossProfit" DOUBLE PRECISION,
  "profitMargin" DOUBLE PRECISION,
  "saleDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_item_sales_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "menu_item_sales_saleId_idx" ON "menu_item_sales"("saleId");
CREATE INDEX IF NOT EXISTS "menu_item_sales_menuItemId_idx" ON "menu_item_sales"("menuItemId");

DO $$ BEGIN
  ALTER TABLE "menu_item_sales" ADD CONSTRAINT IF NOT EXISTS "menu_item_sales_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "menu_item_sales" ADD CONSTRAINT IF NOT EXISTS "menu_item_sales_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN null; END $$;

COMMIT;

-- End of migration
