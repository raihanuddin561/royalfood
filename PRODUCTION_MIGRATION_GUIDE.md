# Production Migration Guide

## Overview
This document outlines the database migrations required for production deployment of the Royal Food application.

## Migration Files Created

### 1. `20240913000001_init`
- **Purpose**: Initial database schema setup
- **Status**: Base migration - should already be applied in production
- **Contents**: Creates all initial tables and relationships

### 2. `20250914120621_add_delivery_charge_to_menu_items`
- **Purpose**: Adds deliveryCharge column to menu_items table
- **Status**: Fixed and ready for production
- **SQL**: 
  ```sql
  ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
  ```

### 3. `20250920180627_add_final_amount_to_orders_and_sales`
- **Purpose**: Adds finalAmount column to orders table
- **Status**: ✅ Created and tested
- **SQL**: 
  ```sql
  ALTER TABLE "public"."orders" ADD COLUMN "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
  ```

## Production Deployment Commands

### For Fresh Production Database:
```bash
# Apply all migrations from scratch
npx prisma migrate deploy
```

### For Existing Production Database:
```bash
# Check migration status first
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

## Important Notes

1. **Never use `prisma db push` in production** - always use migrations
2. **Always backup your production database** before running migrations
3. **Test migrations in staging environment** before production
4. **The finalAmount field** is now properly added and will resolve the order submission errors

## Verification

After deployment, verify that:
- [ ] All 3 migrations are applied
- [ ] `menu_items` table has `deliveryCharge` column
- [ ] `orders` table has `finalAmount` column
- [ ] Order submission works without errors

## Rollback Plan

If issues occur, you can rollback by:
1. Restoring from database backup
2. Or manually removing the columns:
   ```sql
   ALTER TABLE "orders" DROP COLUMN "finalAmount";
   ALTER TABLE "menu_items" DROP COLUMN "deliveryCharge";
   ```

## Files to Deploy

Ensure these migration files are included in your production deployment:
- `prisma/migrations/20240913000001_init/migration.sql`
- `prisma/migrations/20250914120621_add_delivery_charge_to_menu_items/migration.sql`
- `prisma/migrations/20250920180627_add_final_amount_to_orders_and_sales/migration.sql`
- `prisma/schema.prisma`