-- Migration State Reset Script
-- Use this if you need to reset the failed migration state

-- This script checks what migrations have been applied and helps with troubleshooting

-- 1. Check current migration state (if using a migrations table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
    RAISE NOTICE 'Prisma migrations table exists';
  ELSE
    RAISE NOTICE 'No Prisma migrations table found';
  END IF;
END $$;

-- 2. Check if the problematic migration changes were partially applied
DO $$
BEGIN
  -- Check if isPreOrder column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'isPreOrder') THEN
    RAISE NOTICE 'isPreOrder column exists in orders table';
  ELSE
    RAISE NOTICE 'isPreOrder column does not exist in orders table';
  END IF;

  -- Check if order_tracking table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_tracking') THEN
    RAISE NOTICE 'order_tracking table exists';
  ELSE
    RAISE NOTICE 'order_tracking table does not exist';
  END IF;

  -- Check if OUT_FOR_DELIVERY enum value exists
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'OUT_FOR_DELIVERY' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
  ) THEN
    RAISE NOTICE 'OUT_FOR_DELIVERY enum value exists';
  ELSE
    RAISE NOTICE 'OUT_FOR_DELIVERY enum value does not exist';
  END IF;
END $$;

-- 3. If you need to manually mark the migration as complete (use with caution)
-- Uncomment and modify the following if using Prisma migrations:

/*
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  '2025_09_12_order_management_enhancement', 
  'your_checksum_here',
  NOW(),
  '2025_09_12_order_management_enhancement',
  NULL,
  NULL,
  NOW(),
  1
)
ON CONFLICT (id) DO UPDATE SET
  finished_at = NOW(),
  logs = NULL,
  rolled_back_at = NULL;
*/

-- 4. Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('orders', 'order_tracking')
ORDER BY tablename, indexname;