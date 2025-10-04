-- Customer System Migration with Password Support
-- Date: 2025-10-04
-- Description: Creates customers table with all required fields including password

DO $$ 
BEGIN 
    -- Create UserRole enum if it doesn't exist, add CUSTOMER if missing
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER');
    ELSE
        BEGIN
            ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

DO $$ 
BEGIN 
    -- Create OrderType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderType') THEN
        CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');
    END IF;
END $$;

DO $$ 
BEGIN 
    -- Create OrderStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

DO $$ 
BEGIN 
    -- Create PaymentStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
    END IF;
END $$;

-- Create customers table with all required fields
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,  -- Added missing password field
    "address" TEXT NOT NULL,
    "city" TEXT,
    "zipCode" TEXT,
    "dateOfBirth" TIMESTAMP(3),  -- Added missing dateOfBirth field
    "preferences" TEXT,  -- Added missing preferences field
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to existing customers table if they don't exist
DO $$ 
BEGIN 
    -- Add password column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'password') THEN
        ALTER TABLE "customers" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temp_password_change_required';
        RAISE NOTICE 'Added password column to customers table';
    END IF;
    
    -- Add dateOfBirth column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'dateOfBirth') THEN
        ALTER TABLE "customers" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
        RAISE NOTICE 'Added dateOfBirth column to customers table';
    END IF;
    
    -- Add preferences column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'preferences') THEN
        ALTER TABLE "customers" ADD COLUMN "preferences" TEXT;
        RAISE NOTICE 'Added preferences column to customers table';
    END IF;
END $$;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");

-- Create delivery_addresses table
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

-- Add foreign key constraint for delivery addresses
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'delivery_addresses_customerId_fkey') THEN
        ALTER TABLE "delivery_addresses" 
        ADD CONSTRAINT "delivery_addresses_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for delivery_addresses.customerId';
    END IF;
END $$;

-- Update existing orders table to support customer orders
DO $$ 
BEGIN 
    -- Add customerId column to orders table if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customerId') THEN
        ALTER TABLE "orders" ADD COLUMN "customerId" TEXT;
        RAISE NOTICE 'Added customerId column to orders table';
    END IF;
    
    -- Add deliveryAddressId column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'deliveryAddressId') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryAddressId" TEXT;
        RAISE NOTICE 'Added deliveryAddressId column to orders table';
    END IF;
    
    -- Add guest customer fields if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'guestName') THEN
        ALTER TABLE "orders" ADD COLUMN "guestName" TEXT;
        ALTER TABLE "orders" ADD COLUMN "guestPhone" TEXT;
        ALTER TABLE "orders" ADD COLUMN "guestEmail" TEXT;
        ALTER TABLE "orders" ADD COLUMN "guestAddress" TEXT;
        RAISE NOTICE 'Added guest customer fields to orders table';
    END IF;
END $$;

-- Add foreign key constraints for orders if they don't exist
DO $$ 
BEGIN 
    -- Customer foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'orders_customerId_fkey') THEN
        ALTER TABLE "orders" 
        ADD CONSTRAINT "orders_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for orders.customerId';
    END IF;
    
    -- Delivery address foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'orders_deliveryAddressId_fkey') THEN
        ALTER TABLE "orders" 
        ADD CONSTRAINT "orders_deliveryAddressId_fkey" 
        FOREIGN KEY ("deliveryAddressId") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for orders.deliveryAddressId';
    END IF;
END $$;

-- Verification queries
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Show summary
DO $$ 
DECLARE
    customer_count integer;
    address_count integer;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM "customers";
    SELECT COUNT(*) INTO address_count FROM "delivery_addresses";
    
    RAISE NOTICE '=== CUSTOMER SYSTEM MIGRATION COMPLETE ===';
    RAISE NOTICE 'Customers table: % records', customer_count;
    RAISE NOTICE 'Delivery addresses table: % records', address_count;
    RAISE NOTICE 'All required columns and constraints have been added.';
END $$;