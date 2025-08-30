BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE lower(typname) = lower('PaymentMethod')) THEN
    EXECUTE 'CREATE TYPE "PaymentMethod" AS ENUM (''CASH'',''CARD'',''DIGITAL_WALLET'',''BANK_TRANSFER'')';
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE lower(typname) = lower('SaleStatus')) THEN
    EXECUTE 'CREATE TYPE "SaleStatus" AS ENUM (''COMPLETED'',''REFUNDED'',''CANCELLED'')';
  END IF;
END$$;

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

CREATE UNIQUE INDEX IF NOT EXISTS "sales_saleNumber_key" ON "sales"("saleNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orderId_key" ON "sales"("orderId");
CREATE INDEX IF NOT EXISTS "sales_userId_idx" ON "sales"("userId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orderId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "sales" ADD CONSTRAINT "sales_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_sales_saleId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "menu_item_sales" ADD CONSTRAINT "menu_item_sales_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_sales_menuItemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "menu_item_sales" ADD CONSTRAINT "menu_item_sales_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

COMMIT;
