-- URGENT FIX: Add deliveryCharge column to menu_items table
-- Date: 2025-09-16
-- Purpose: Fix order submission by ensuring deliveryCharge column exists

-- First, let's check what we're working with
DO $$
DECLARE
    column_exists BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'menu_items table does not exist!';
    END IF;
    
    RAISE NOTICE 'menu_items table exists, proceeding with column check';
    
    -- Check if column exists (case sensitive)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
        AND column_name = 'deliveryCharge'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'deliveryCharge column already exists';
    ELSE
        RAISE NOTICE 'deliveryCharge column does NOT exist, adding it now';
        
        -- Add the column
        EXECUTE 'ALTER TABLE "menu_items" ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0';
        
        RAISE NOTICE 'Successfully added deliveryCharge column to menu_items table';
    END IF;
    
    -- Verify the column was added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
        AND column_name = 'deliveryCharge'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'CONFIRMATION: deliveryCharge column now exists';
    ELSE
        RAISE EXCEPTION 'FAILED: deliveryCharge column still does not exist after attempting to add it';
    END IF;
    
END $$;