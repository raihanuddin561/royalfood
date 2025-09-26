-- BULLETPROOF MEAL TYPES MIGRATION
-- Date: 2025-09-26
-- Description: Complete, bulletproof migration for meal types system
--              Handles ALL possible database states without conflicts
--              Checks every constraint, column, and table before making changes

-- MIGRATION STRATEGY:
-- 1. Check and create MealType enum only if needed
-- 2. Check and create/update menu_items table structure only if needed
-- 3. Check and add mealTypes column only if needed
-- 4. Check and migrate existing data only if needed
-- 5. Check and add constraints only if needed
-- 6. Detailed logging for every step

BEGIN;

-- =============================================================================
-- STEP 1: ENUM TYPE MANAGEMENT
-- =============================================================================

DO $$
DECLARE
    enum_exists BOOLEAN;
BEGIN
    -- Check if MealType enum exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'MealType' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO enum_exists;
    
    IF NOT enum_exists THEN
        CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
        RAISE NOTICE '[✓] Created MealType enum';
    ELSE
        RAISE NOTICE '[✓] MealType enum already exists';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: TABLE STRUCTURE MANAGEMENT
-- =============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    old_column_exists BOOLEAN;
    constraint_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    -- Check if menu_items table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create table with mealTypes column from the start
        CREATE TABLE "public"."menu_items" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "price" DECIMAL(65,30) NOT NULL,
            "category" TEXT NOT NULL,
            "isAvailable" BOOLEAN NOT NULL DEFAULT true,
            "imageUrl" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "mealTypes" "public"."MealType"[] NOT NULL DEFAULT ARRAY['LUNCH']::"public"."MealType"[],
            CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "menu_items_mealTypes_not_empty" CHECK (array_length("mealTypes", 1) > 0)
        );
        RAISE NOTICE '[✓] Created menu_items table with mealTypes column';
        
    ELSE
        RAISE NOTICE '[✓] menu_items table already exists';
        
        -- Check if mealTypes column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'menu_items' 
            AND column_name = 'mealTypes'
        ) INTO column_exists;
        
        -- Check if old mealType column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'menu_items' 
            AND column_name = 'mealType'
        ) INTO old_column_exists;
        
        -- Get record count
        SELECT COUNT(*) FROM "public"."menu_items" INTO record_count;
        
        IF NOT column_exists THEN
            -- Add mealTypes column
            ALTER TABLE "public"."menu_items" 
            ADD COLUMN "mealTypes" "public"."MealType"[] 
            DEFAULT ARRAY['LUNCH']::"public"."MealType"[];
            RAISE NOTICE '[✓] Added mealTypes column to existing table (% records)', record_count;
            
            -- Make it NOT NULL after adding default values
            ALTER TABLE "public"."menu_items" 
            ALTER COLUMN "mealTypes" SET NOT NULL;
            RAISE NOTICE '[✓] Set mealTypes column to NOT NULL';
            
        ELSE
            RAISE NOTICE '[✓] mealTypes column already exists';
        END IF;
        
        -- Handle migration from old mealType column
        IF old_column_exists THEN
            RAISE NOTICE '[→] Migrating data from old mealType column...';
            
            -- Update records that have old mealType but null/empty mealTypes
            UPDATE "public"."menu_items" 
            SET "mealTypes" = ARRAY["mealType"]::"public"."MealType"[]
            WHERE "mealType" IS NOT NULL 
            AND ("mealTypes" IS NULL OR array_length("mealTypes", 1) IS NULL);
            
            GET DIAGNOSTICS record_count = ROW_COUNT;
            RAISE NOTICE '[✓] Migrated % records from mealType to mealTypes', record_count;
            
            -- Drop the old column
            ALTER TABLE "public"."menu_items" DROP COLUMN "mealType";
            RAISE NOTICE '[✓] Removed old mealType column';
        ELSE
            RAISE NOTICE '[✓] No old mealType column found';
        END IF;
        
        -- Ensure all records have valid mealTypes
        UPDATE "public"."menu_items" 
        SET "mealTypes" = ARRAY['LUNCH']::"public"."MealType"[]
        WHERE "mealTypes" IS NULL OR array_length("mealTypes", 1) IS NULL;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        IF record_count > 0 THEN
            RAISE NOTICE '[✓] Fixed % records with empty mealTypes', record_count;
        END IF;
        
        -- Check and add constraint
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'menu_items' 
            AND constraint_name = 'menu_items_mealTypes_not_empty'
        ) INTO constraint_exists;
        
        IF NOT constraint_exists THEN
            ALTER TABLE "public"."menu_items" 
            ADD CONSTRAINT "menu_items_mealTypes_not_empty" 
            CHECK (array_length("mealTypes", 1) > 0);
            RAISE NOTICE '[✓] Added mealTypes not empty constraint';
        ELSE
            RAISE NOTICE '[✓] mealTypes constraint already exists';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- STEP 3: FINAL VALIDATION AND CLEANUP
-- =============================================================================

DO $$
DECLARE
    total_items INTEGER;
    breakfast_items INTEGER;
    lunch_items INTEGER;
    dinner_items INTEGER;
    multi_meal_items INTEGER;
    empty_meal_items INTEGER;
BEGIN
    -- Get statistics
    SELECT COUNT(*) FROM "public"."menu_items" INTO total_items;
    
    SELECT COUNT(*) FROM "public"."menu_items" 
    WHERE 'BREAKFAST' = ANY("mealTypes") INTO breakfast_items;
    
    SELECT COUNT(*) FROM "public"."menu_items" 
    WHERE 'LUNCH' = ANY("mealTypes") INTO lunch_items;
    
    SELECT COUNT(*) FROM "public"."menu_items" 
    WHERE 'DINNER' = ANY("mealTypes") INTO dinner_items;
    
    SELECT COUNT(*) FROM "public"."menu_items" 
    WHERE array_length("mealTypes", 1) > 1 INTO multi_meal_items;
    
    SELECT COUNT(*) FROM "public"."menu_items" 
    WHERE "mealTypes" IS NULL OR array_length("mealTypes", 1) IS NULL INTO empty_meal_items;
    
    -- Report final statistics
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Total menu items: %', total_items;
    RAISE NOTICE 'Breakfast items: %', breakfast_items;
    RAISE NOTICE 'Lunch items: %', lunch_items;
    RAISE NOTICE 'Dinner items: %', dinner_items;
    RAISE NOTICE 'Multi-meal items: %', multi_meal_items;
    RAISE NOTICE 'Items with empty meal types: %', empty_meal_items;
    
    IF empty_meal_items > 0 THEN
        RAISE EXCEPTION 'MIGRATION FAILED: % items have empty meal types', empty_meal_items;
    END IF;
    
    RAISE NOTICE '[✅] All validations passed - meal types system ready!';
END $$;

-- Update all updatedAt timestamps
UPDATE "public"."menu_items" 
SET "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;