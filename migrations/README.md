# Meal Type Migration Documentation

This directory contains migration scripts and documentation for converting the `mealType` field from a single enum to a `mealTypes` array to support multiple meal types per menu item.

## Migration Files

### 1. `meal-types-migration.sql`
**Raw SQL migration script** - Production-ready SQL that can be executed directly on the database.

```bash
# Execute manually in database
psql -d royal_food_db -f migrations/meal-types-migration.sql
```

**Features:**
- ✅ Data preservation during migration  
- ✅ Rollback safety with proper constraints
- ✅ Default value handling
- ✅ Verification queries included

### 2. `migrate-meal-types-production.js`
**Node.js production migration script** - Comprehensive migration tool with safety features.

```bash
# Dry run (preview changes)
node migrations/migrate-meal-types-production.js --dry-run

# Execute migration
node migrations/migrate-meal-types-production.js

# Rollback migration (requires backup)
node migrations/migrate-meal-types-production.js --rollback
```

**Features:**
- ✅ Automatic backup creation
- ✅ Dry-run mode for testing
- ✅ Rollback capability
- ✅ Schema validation
- ✅ Data integrity checks
- ✅ Detailed logging

### 3. `verify-meal-types-migration.js`
**Migration verification script** - Validates migration success and provides statistics.

```bash
# Verify migration status
node migrations/verify-meal-types-migration.js
```

**Features:**
- ✅ Schema validation
- ✅ Data statistics
- ✅ Constraint verification
- ✅ Sample data display

## Migration Process

### Schema Changes
```sql
-- Before
mealType MealType DEFAULT 'LUNCH'

-- After  
mealTypes MealType[] DEFAULT ARRAY['LUNCH']
```

### Data Transformation
```javascript
// Before
{ mealType: 'LUNCH' }

// After
{ mealTypes: ['LUNCH'] }

// Multiple meal types (new capability)
{ mealTypes: ['BREAKFAST', 'LUNCH'] }
```

## Prisma Migration

The Prisma migration file is located at:
```
prisma/migrations/20250925170537_multiple_meal_types/migration.sql
```

This was automatically generated when running:
```bash
npx prisma migrate dev --name multiple_meal_types
```

## Safety Measures

### 1. Data Backup
All migration scripts create automatic backups:
- `meal-types-backup.json` - Full data backup before migration
- Backup includes all menu item IDs and their meal type data

### 2. Constraints
```sql
-- Ensures meal types array is never empty
ALTER TABLE "public"."menu_items" 
ADD CONSTRAINT "menu_items_mealTypes_not_empty" 
CHECK (array_length("mealTypes", 1) > 0);
```

### 3. Default Values
```sql
-- All new records get default LUNCH meal type
"mealTypes" "public"."MealType"[] DEFAULT ARRAY['LUNCH']
```

## Verification Steps

### 1. Pre-Migration Check
```bash
# Check current schema
node migrations/verify-meal-types-migration.js

# Backup current data
node check-meal-types.js > pre-migration-backup.txt
```

### 2. Migration Execution
```bash
# Test migration (safe)
node migrations/migrate-meal-types-production.js --dry-run

# Execute migration
node migrations/migrate-meal-types-production.js
```

### 3. Post-Migration Verification
```bash
# Verify migration success
node migrations/verify-meal-types-migration.js

# Check application functionality
npm run build && npm start
```

## Rollback Procedure

If migration needs to be rolled back:

```bash
# 1. Stop application
pm2 stop royal-food

# 2. Rollback database
node migrations/migrate-meal-types-production.js --rollback

# 3. Revert code changes
git checkout HEAD~1 -- prisma/schema.prisma src/

# 4. Regenerate Prisma client
npx prisma generate

# 5. Restart application
npm run build && pm2 start royal-food
```

## Testing

### 1. Admin Interface Testing
- ✅ Create menu items with multiple meal types
- ✅ Edit existing items to change meal types
- ✅ Verify meal type badges display correctly
- ✅ Test meal type filtering

### 2. Customer Interface Testing  
- ✅ Meal type selection on order page
- ✅ Menu filtering by meal type
- ✅ Cart validation for incompatible items
- ✅ Order submission validation

### 3. API Testing
```bash
# Test menu creation with multiple meal types
curl -X POST http://localhost:3000/api/menu-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","categoryId":"...","mealTypes":["BREAKFAST","LUNCH"]}'

# Test menu item retrieval
curl http://localhost:3000/api/public/menu
```

## Production Deployment

### 1. Staging Environment
```bash
# Deploy to staging
git push staging main

# Run migration on staging
node migrations/migrate-meal-types-production.js --dry-run
node migrations/migrate-meal-types-production.js

# Test functionality
npm run test
```

### 2. Production Environment
```bash
# Create database backup
pg_dump royal_food_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Deploy code
git push production main

# Run migration with monitoring
node migrations/migrate-meal-types-production.js

# Verify deployment
node migrations/verify-meal-types-migration.js
```

## Troubleshooting

### Common Issues

1. **Empty mealTypes Arrays**
```sql
UPDATE "public"."menu_items" 
SET "mealTypes" = ARRAY['LUNCH'] 
WHERE array_length("mealTypes", 1) IS NULL;
```

2. **Missing Default Values**
```sql
ALTER TABLE "public"."menu_items" 
ALTER COLUMN "mealTypes" SET DEFAULT ARRAY['LUNCH'];
```

3. **Constraint Violations**
```sql
-- Check which items violate constraints
SELECT id, name, "mealTypes" FROM "public"."menu_items" 
WHERE array_length("mealTypes", 1) IS NULL OR array_length("mealTypes", 1) = 0;
```

### Recovery Commands
```bash
# Reset to clean state
npm run prisma:reset

# Regenerate from schema
npx prisma db push

# Seed with test data
npm run seed
```

## Migration Status

- ✅ **Schema Updated**: `mealType` → `mealTypes[]`
- ✅ **Data Migrated**: All 16 existing items have default `['LUNCH']`
- ✅ **API Updated**: All endpoints handle arrays
- ✅ **Frontend Updated**: Admin and customer interfaces support multiple meal types
- ✅ **Validation Added**: Order validation prevents incompatible selections

---

**Migration Date**: September 26, 2025  
**Database**: PostgreSQL (royal_food_db)  
**Framework**: Prisma + Next.js  
**Status**: ✅ Completed Successfully