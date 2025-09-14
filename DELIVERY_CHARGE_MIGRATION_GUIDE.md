# DeliveryCharge Column Migration Guide

## Issue
The menu creation system is failing on Vercel with the error:
```
prisma:error 
Invalid `prisma.menuItem.findFirst()` invocation:
The column `menu_items.deliveryCharge` does not exist in the current database.
```

## Solution
This issue occurs because the `deliveryCharge` column exists in the Prisma schema but hasn't been added to the actual database table. We've created multiple migration options to fix this.

## Migration Options

### Option 1: Use the Admin Migration API (Recommended)
1. Deploy the latest code to Vercel
2. Visit your Vercel app admin panel: `https://your-app.vercel.app/admin/migrations`
3. Run the migration system which will automatically apply all pending migrations including the deliveryCharge column

### Option 2: Use the Direct Migration API
1. After deployment, make a POST request to:
   ```
   https://your-app.vercel.app/api/admin/apply-delivery-charge-migration
   ```
2. This will check if the column exists and add it if needed

### Option 3: Manual Database Update
If you have direct database access, run this SQL:
```sql
ALTER TABLE "menu_items" 
ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
```

## Verification
After applying any migration option, you can verify the fix by:
1. Trying to create a new menu item
2. The error should be resolved and menu creation should work normally

## Migration Files Created
- `/scripts/migrations/2025_09_14_add_delivery_charge_to_menu_items.sql` - For admin migration system
- `/scripts/add-delivery-charge-migration.js` - Standalone script
- `/src/app/api/admin/apply-delivery-charge-migration/route.ts` - API endpoint
- Updated Prisma migration file with proper SQL

## Safety Features
- All migration scripts check if the column already exists before attempting to add it
- No risk of duplicate columns or errors if run multiple times
- Default value of 0 ensures existing menu items continue to work