CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    zip_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_addresses (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    zip_code TEXT,
    landmark TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_addresses (
    id TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    "zipCode" TEXT,
    landmark TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customerId') THEN
        ALTER TABLE orders ADD COLUMN "customerId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveryAddressId') THEN
        ALTER TABLE orders ADD COLUMN "deliveryAddressId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestName') THEN
        ALTER TABLE orders ADD COLUMN "guestName" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestPhone') THEN
        ALTER TABLE orders ADD COLUMN "guestPhone" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestEmail') THEN
        ALTER TABLE orders ADD COLUMN "guestEmail" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='guestAddress') THEN
        ALTER TABLE orders ADD COLUMN "guestAddress" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveryFee') THEN
        ALTER TABLE orders ADD COLUMN "deliveryFee" DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='kitchenNotes') THEN
        ALTER TABLE orders ADD COLUMN "kitchenNotes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimatedTime') THEN
        ALTER TABLE orders ADD COLUMN "estimatedTime" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='paymentMethod') THEN
        ALTER TABLE orders ADD COLUMN "paymentMethod" TEXT DEFAULT 'CASH';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='paymentStatus') THEN
        ALTER TABLE orders ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='orderDate') THEN
        ALTER TABLE orders ADD COLUMN "orderDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='confirmedAt') THEN
        ALTER TABLE orders ADD COLUMN "confirmedAt" TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='preparingAt') THEN
        ALTER TABLE orders ADD COLUMN "preparingAt" TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='readyAt') THEN
        ALTER TABLE orders ADD COLUMN "readyAt" TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deliveredAt') THEN
        ALTER TABLE orders ADD COLUMN "deliveredAt" TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customerId') THEN
        ALTER TABLE sales ADD COLUMN "customerId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='subtotal') THEN
        ALTER TABLE sales ADD COLUMN subtotal DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='deliveryFee') THEN
        ALTER TABLE sales ADD COLUMN "deliveryFee" DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_customer' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
            FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_delivery_address' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_address 
            FOREIGN KEY ("deliveryAddressId") REFERENCES delivery_addresses(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_sales_customer' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT fk_sales_customer 
            FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_customer ON delivery_addresses("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders("deliveryAddressId");
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales("customerId");

UPDATE orders 
SET subtotal = COALESCE("totalAmount" - "taxAmount" + "discountAmount", "totalAmount")
WHERE subtotal IS NULL;

UPDATE sales 
SET subtotal = COALESCE("totalAmount" - "taxAmount" + "discountAmount", "totalAmount")
WHERE subtotal IS NULL;
