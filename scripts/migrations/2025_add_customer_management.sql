-- Add Customer Management Tables
-- This migration adds support for customer-facing ordering system

-- 1. Create customers table
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

-- 2. Create delivery_addresses table
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

-- 3. Update orders table to support customer orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_time INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'CASH';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- 4. Update sales table to support customer tracking
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Add foreign key constraints
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_address 
    FOREIGN KEY (delivery_address_id) REFERENCES delivery_addresses(id) ON DELETE SET NULL;
ALTER TABLE sales ADD CONSTRAINT fk_sales_customer 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_customer ON delivery_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

-- Migrate existing orders to use subtotal and total_amount properly
UPDATE orders 
SET subtotal = COALESCE(total_amount - tax_amount + discount_amount, total_amount)
WHERE subtotal IS NULL;

-- Migrate existing sales to use subtotal properly  
UPDATE sales 
SET subtotal = COALESCE(total_amount - tax_amount + discount_amount, total_amount)
WHERE subtotal IS NULL;

-- Add sample data for testing (optional)
-- INSERT INTO customers (id, email, phone, name, address, city) VALUES
-- ('cust_001', 'john.doe@email.com', '+8801234567890', 'John Doe', '123 Main St, Dhaka', 'Dhaka'),
-- ('cust_002', 'jane.smith@email.com', '+8801234567891', 'Jane Smith', '456 Park Ave, Chittagong', 'Chittagong');

COMMIT;
