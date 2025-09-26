-- Migration: Comprehensive meal types setup for production
-- Date: 2025-09-26
-- Description: Creates MealType enum and converts menu_items to use mealTypes array
--              Handles all possible database states in production

-- This migration safely:
-- 1. Creates MealType enum if not exists
-- 2. Creates menu_items table if not exists (with mealTypes array)
-- 3. Adds mealTypes column to existing menu_items if needed
-- 4. Migrates any existing mealType data to mealTypes array
-- 5. Removes old mealType column if it exists

BEGIN;

-- Step 1: Create the MealType enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MealType') THEN
        CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
        RAISE NOTICE 'Created MealType enum';
    ELSE
        RAISE NOTICE 'MealType enum already exists';
    END IF;
END $$;

-- Step 2: Ensure menu_items table exists with basic structure
-- (This handles cases where the table doesn't exist at all)
CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "category" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add mealTypes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'mealTypes'
    ) THEN
        ALTER TABLE "public"."menu_items" 
        ADD COLUMN "mealTypes" "public"."MealType"[] 
        DEFAULT ARRAY['LUNCH']::"public"."MealType"[];
        RAISE NOTICE 'Added mealTypes column';
    ELSE
        RAISE NOTICE 'mealTypes column already exists';
    END IF;
END $$;

-- Step 4: Migrate existing mealType data to mealTypes arrays (if old column exists)
DO $$
BEGIN
    -- Check if the old mealType column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'mealType'
    ) THEN
        RAISE NOTICE 'Found old mealType column, migrating data...';
        
        -- Update mealTypes based on existing mealType values
        UPDATE "public"."menu_items" 
        SET "mealTypes" = ARRAY["mealType"]::"public"."MealType"[]
        WHERE "mealType" IS NOT NULL;
        
        -- Drop the old mealType column
        ALTER TABLE "public"."menu_items" DROP COLUMN "mealType";
        RAISE NOTICE 'Migrated and removed old mealType column';
    ELSE
        RAISE NOTICE 'No old mealType column found, skipping migration';
    END IF;
END $$;

-- Step 5: Ensure all records have at least one meal type
-- Update any NULL or empty arrays to have default LUNCH value
UPDATE "public"."menu_items" 
SET "mealTypes" = ARRAY['LUNCH']::"public"."MealType"[]
WHERE "mealTypes" IS NULL OR array_length("mealTypes", 1) IS NULL;

-- Step 6: Add constraint to ensure at least one meal type is always present
-- Drop constraint first if it exists, then recreate it
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND constraint_name = 'menu_items_mealTypes_not_empty'
    ) THEN
        ALTER TABLE "public"."menu_items" DROP CONSTRAINT "menu_items_mealTypes_not_empty";
    END IF;
    
    -- Add the constraint
    ALTER TABLE "public"."menu_items" 
    ADD CONSTRAINT "menu_items_mealTypes_not_empty" 
    CHECK (array_length("mealTypes", 1) > 0);
    
    RAISE NOTICE 'Added mealTypes not empty constraint';
END $$;

-- Step 7: Update timestamp for all records (trigger updated_at)
UPDATE "public"."menu_items" 
SET "updatedAt" = CURRENT_TIMESTAMP 
WHERE "updatedAt" < CURRENT_TIMESTAMP;

COMMIT;

-- Final verification query (commented out for production)
-- SELECT 
--   COUNT(*) as total_items,
--   COUNT(*) FILTER (WHERE 'BREAKFAST' = ANY("mealTypes")) as breakfast_items,
--   COUNT(*) FILTER (WHERE 'LUNCH' = ANY("mealTypes")) as lunch_items,
--   COUNT(*) FILTER (WHERE 'DINNER' = ANY("mealTypes")) as dinner_items,
--   COUNT(*) FILTER (WHERE array_length("mealTypes", 1) > 1) as multi_meal_items
-- FROM "public"."menu_items";