-- Migration: Add deliveryCharge column to menu_items table
-- Date: 2025-09-14
-- Purpose: Add deliveryCharge column to support item-specific delivery charges

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
        AND column_name = 'deliveryCharge'
        AND table_schema = 'public'
    ) THEN
        -- Add the deliveryCharge column with default value 0
        ALTER TABLE "menu_items" 
        ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added deliveryCharge column to menu_items table';
    ELSE
        RAISE NOTICE 'deliveryCharge column already exists in menu_items table';
    END IF;
END $$;