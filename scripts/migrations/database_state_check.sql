-- Emergency Migration Cleanup Script
-- Use this to check database state and manually mark migrations as complete if needed

-- Check current database schema state
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('purchase_items', 'users', 'purchases', 'orders', 'order_tracking', 'customers')
ORDER BY table_name, ordinal_position;

-- Check existing constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('purchase_items', 'users', 'purchases', 'orders', 'order_tracking', 'customers')
ORDER BY tc.table_name, tc.constraint_name;

-- Check if migration tracking table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = '_prisma_migrations'
) AS has_migration_table;