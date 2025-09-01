DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER');
    ELSE
        BEGIN
            ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CUSTOMER';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");

CREATE TABLE IF NOT EXISTS "delivery_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "zipCode" TEXT,
    "landmark" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "delivery_addresses" 
ADD CONSTRAINT IF NOT EXISTS "delivery_addresses_customerId_fkey" 
FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customerId') THEN
        ALTER TABLE "orders" ADD COLUMN "customerId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveryAddressId') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryAddressId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestName') THEN
        ALTER TABLE "orders" ADD COLUMN "guestName" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestPhone') THEN
        ALTER TABLE "orders" ADD COLUMN "guestPhone" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestEmail') THEN
        ALTER TABLE "orders" ADD COLUMN "guestEmail" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestAddress') THEN
        ALTER TABLE "orders" ADD COLUMN "guestAddress" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE "orders" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='taxAmount') THEN
        ALTER TABLE "orders" ADD COLUMN "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discountAmount') THEN
        ALTER TABLE "orders" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveryFee') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='kitchenNotes') THEN
        ALTER TABLE "orders" ADD COLUMN "kitchenNotes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimatedTime') THEN
        ALTER TABLE "orders" ADD COLUMN "estimatedTime" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='paymentStatus') THEN
        ALTER TABLE "orders" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='confirmedAt') THEN
        ALTER TABLE "orders" ADD COLUMN "confirmedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='preparingAt') THEN
        ALTER TABLE "orders" ADD COLUMN "preparingAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='readyAt') THEN
        ALTER TABLE "orders" ADD COLUMN "readyAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveredAt') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveredAt" TIMESTAMP(3);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customerId') THEN
        ALTER TABLE "sales" ADD COLUMN "customerId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='subtotal') THEN
        ALTER TABLE "sales" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='taxAmount') THEN
        ALTER TABLE "sales" ADD COLUMN "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='discountAmount') THEN
        ALTER TABLE "sales" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='deliveryFee') THEN
        ALTER TABLE "sales" ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='finalAmount') THEN
        ALTER TABLE "sales" ADD COLUMN "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_customerId_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_deliveryAddressId_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" 
        FOREIGN KEY ("deliveryAddressId") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_customerId_fkey' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers"("email");
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers"("phone");
CREATE INDEX IF NOT EXISTS "customers_isActive_idx" ON "customers"("isActive");
CREATE INDEX IF NOT EXISTS "customers_createdAt_idx" ON "customers"("createdAt");

CREATE INDEX IF NOT EXISTS "delivery_addresses_customerId_idx" ON "delivery_addresses"("customerId");
CREATE INDEX IF NOT EXISTS "delivery_addresses_isDefault_idx" ON "delivery_addresses"("isDefault");

CREATE INDEX IF NOT EXISTS "orders_customerId_idx" ON "orders"("customerId");
CREATE INDEX IF NOT EXISTS "orders_deliveryAddressId_idx" ON "orders"("deliveryAddressId");
CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_orderType_idx" ON "orders"("orderType");
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_idx" ON "orders"("paymentStatus");

CREATE INDEX IF NOT EXISTS "sales_customerId_idx" ON "sales"("customerId");
CREATE INDEX IF NOT EXISTS "sales_saleDate_idx" ON "sales"("saleDate");

UPDATE "orders" 
SET 
    "subtotal" = COALESCE("totalAmount", 0),
    "taxAmount" = 0,
    "discountAmount" = 0,
    "deliveryFee" = 0
WHERE ("subtotal" = 0 OR "subtotal" IS NULL) AND "totalAmount" IS NOT NULL;

UPDATE "sales" 
SET 
    "subtotal" = COALESCE("totalAmount", 0),
    "taxAmount" = 0,
    "discountAmount" = COALESCE("discountAmount", 0),
    "deliveryFee" = 0,
    "finalAmount" = COALESCE("totalAmount", 0) - COALESCE("discountAmount", 0)
WHERE ("subtotal" = 0 OR "subtotal" IS NULL) AND "totalAmount" IS NOT NULL;

INSERT INTO "customers" ("id", "email", "phone", "name", "address", "city", "isActive") 
VALUES 
    ('test-customer-1', 'test@example.com', '+8801711111111', 'Test Customer', '123 Test Street', 'Dhaka', true),
    ('test-customer-2', 'guest@example.com', '+8801722222222', 'Guest Customer', '456 Guest Avenue', 'Chittagong', true)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "delivery_addresses" ("id", "customerId", "label", "address", "city", "isDefault")
SELECT 
    'addr-' || "id" || '-home',
    "id",
    'Home',
    "address",
    "city",
    true
FROM "customers"
WHERE "id" IN ('test-customer-1', 'test-customer-2')
ON CONFLICT DO NOTHING;

SELECT 'customers' as table_name, COUNT(*) as record_count FROM "customers"
UNION ALL
SELECT 'delivery_addresses' as table_name, COUNT(*) as record_count FROM "delivery_addresses";

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customerId', 'deliveryAddressId', 'guestName', 'guestPhone', 'subtotal', 'taxAmount', 'paymentStatus')
ORDER BY column_name;

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN ('customerId', 'subtotal', 'taxAmount', 'deliveryFee')
ORDER BY column_name;

SELECT 'CUSTOMER SYSTEM MIGRATION COMPLETED' as status, NOW() as completed_at;
