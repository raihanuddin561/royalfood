-- Migration: Convert mealType to mealTypes array
-- Date: 2025-09-26
-- Description: Converts single mealType enum field to mealTypes array field
--              to support multiple meal types per menu item

-- This migration:
-- 0. Creates MealType enum if it doesn't exist
-- 1. Adds the new mealTypes array column with default value
-- 2. Migrates existing mealType data to mealTypes array
-- 3. Removes the old mealType column

BEGIN;

-- Step 0: Create the MealType enum if it doesn't exist
-- This ensures we have the enum type before creating array columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MealType') THEN
        CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
    END IF;
END $$;

-- Step 1: Add the new mealTypes column with default value
-- This ensures all existing records get a default value of ['LUNCH']
ALTER TABLE "public"."menu_items" 
ADD COLUMN IF NOT EXISTS "mealTypes" "public"."MealType"[] 
DEFAULT ARRAY['LUNCH']::"public"."MealType"[];

-- Step 2: Migrate existing data (if mealType column still exists)
-- Convert single mealType values to mealTypes arrays
-- This handles the case where we're upgrading from the old schema
DO $$
BEGIN
    -- Check if the old mealType column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'mealType'
    ) THEN
        -- Update mealTypes based on existing mealType values
        UPDATE "public"."menu_items" 
        SET "mealTypes" = ARRAY["mealType"]::"public"."MealType"[]
        WHERE "mealType" IS NOT NULL;
        
        -- Drop the old mealType column
        ALTER TABLE "public"."menu_items" DROP COLUMN "mealType";
    END IF;
END $$;

-- Step 3: Ensure all records have at least one meal type
-- Update any NULL or empty arrays to have default LUNCH value
UPDATE "public"."menu_items" 
SET "mealTypes" = ARRAY['LUNCH']::"public"."MealType"[]
WHERE "mealTypes" IS NULL OR array_length("mealTypes", 1) IS NULL;

-- Step 4: Add constraint to ensure at least one meal type is always present
-- This prevents empty arrays in the future
ALTER TABLE "public"."menu_items" 
ADD CONSTRAINT "menu_items_mealTypes_not_empty" 
CHECK (array_length("mealTypes", 1) > 0);

COMMIT;

-- Verification queries (run these manually to verify the migration)
-- SELECT id, name, "mealTypes" FROM "public"."menu_items" LIMIT 10;
-- SELECT COUNT(*) as total_items, 
--        COUNT(*) FILTER (WHERE 'BREAKFAST' = ANY("mealTypes")) as breakfast_items,
--        COUNT(*) FILTER (WHERE 'LUNCH' = ANY("mealTypes")) as lunch_items,
--        COUNT(*) FILTER (WHERE 'DINNER' = ANY("mealTypes")) as dinner_items
-- FROM "public"."menu_items";