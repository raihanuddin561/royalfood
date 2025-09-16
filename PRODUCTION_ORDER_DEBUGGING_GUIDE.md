# 🚨 PRODUCTION ORDER SUBMISSION DEBUGGING GUIDE

## Issue: Order submission failing in production but working locally

This guide will help you systematically debug and fix the order submission issue in your Vercel deployment.

## 🔍 Step 1: Run Production Diagnostics

I've enhanced the codebase with comprehensive debugging tools. Run these tests in production:

### 1.1 Check Overall Production Health
```bash
curl https://royal-food-rs.vercel.app/api/debug/production
```

**What this checks:**
- Environment variables
- Database connectivity
- Table structure
- Missing migrations
- DeliveryCharge column status

### 1.2 Test Database Schema
```bash
curl -X POST https://royal-food-rs.vercel.app/api/test/order-submission \
  -H "Content-Type: application/json" \
  -d '{"testType": "schema"}'
```

### 1.3 Test Order Submission with Mock Data
```bash
curl -X POST https://royal-food-rs.vercel.app/api/test/order-submission \
  -H "Content-Type: application/json" \
  -d '{"testType": "basic"}'
```

## 🛠️ Step 2: Apply the Critical Migration

Based on the diagnosis, the most likely issue is the missing `deliveryCharge` column. Apply the migration:

### Option A: Use the Quick Fix Endpoint

1. **Set the migration secret in Vercel:**
   ```env
   MIGRATION_SECRET=fix-order-submission-2024
   ```

2. **Apply the migration:**
   ```bash
   curl -X POST https://royal-food-rs.vercel.app/api/fix-order-migration \
     -H "Content-Type: application/json" \
     -d '{"migrationSecret": "fix-order-submission-2024"}'
   ```

### Option B: Use Prisma Migration API

```bash
curl -X POST https://royal-food-rs.vercel.app/api/admin/prisma-migrate \
  -H "Content-Type: application/json" \
  -d '{"action": "deploy"}'
```

## 🧪 Step 3: Test After Migration

### 3.1 Verify Migration Applied
```bash
curl https://royal-food-rs.vercel.app/api/fix-order-migration
```

Should return:
```json
{
  "success": true,
  "columnExists": true,
  "migrationRecorded": true,
  "message": "Migration applied"
}
```

### 3.2 Test Order Submission
```bash
curl -X POST https://royal-food-rs.vercel.app/api/test/order-submission \
  -H "Content-Type: application/json" \
  -d '{"testType": "delivery"}'
```

### 3.3 Test Real Order from Frontend
1. Go to: https://royal-food-rs.vercel.app/public/cart
2. Add items and submit an order
3. Check for success

## 🔧 Step 4: Environment Variables Check

Ensure these are set in Vercel:

```env
DATABASE_URL_NEW=postgresql://user:pass@host:5432/royal_food_db?sslmode=require
MIGRATION_SECRET=fix-order-submission-2024
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://royal-food-rs.vercel.app
NODE_ENV=production
```

## 📋 Common Issues and Solutions

### Issue 1: Missing deliveryCharge Column
**Symptom:** API returns database error about deliveryCharge
**Solution:** Apply migration using Option A or B above

### Issue 2: Database Connection Error
**Symptom:** "DATABASE_URL_NEW is not defined" or connection timeout
**Solution:** Verify DATABASE_URL_NEW in Vercel environment variables

### Issue 3: No Menu Items
**Symptom:** "No active menu items found"
**Solution:** Add menu items through admin panel first

### Issue 4: Validation Errors
**Symptom:** Zod validation failures
**Solution:** Check frontend is sending correct data format

### Issue 5: Missing Tables
**Symptom:** Table doesn't exist errors
**Solution:** Run full database migration

## 🚀 Step 5: Deploy Updated Code

The enhanced error handling and debugging tools need to be deployed:

```bash
git add .
git commit -m "Enhanced order submission debugging and error handling"
git push origin main
```

Wait for Vercel deployment to complete, then run the tests again.

## 📊 Expected Debug Output

### Healthy System Response:
```json
{
  "success": true,
  "health": {
    "status": "HEALTHY",
    "criticalIssues": [],
    "issueCount": 0
  },
  "checks": {
    "database": {"connection": "SUCCESS"},
    "deliveryCharge": {"exists": true},
    "migrations": {"targetMigrationApplied": true}
  }
}
```

### Problematic System Response:
```json
{
  "success": true,
  "health": {
    "status": "ISSUES_FOUND",
    "criticalIssues": [
      "Missing deliveryCharge column in menu_items table",
      "Critical migration not applied: 20250914120621_add_delivery_charge_to_menu_items"
    ],
    "issueCount": 2
  }
}
```

## 🆘 Emergency Manual Fix

If API methods fail, execute this SQL directly in your database:

```sql
-- Add the missing column
ALTER TABLE "menu_items" 
ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Mark migration as applied
INSERT INTO "_prisma_migrations" (
  id, 
  checksum, 
  finished_at, 
  migration_name, 
  logs, 
  rolled_back_at, 
  started_at, 
  applied_steps_count
) VALUES (
  '20250914120621-add-delivery-charge-to-menu-items',
  'b5c2a6f1e8d9c3a7b2f6e4d8c9a5b3f7e1d8c6a9',
  NOW(),
  '20250914120621_add_delivery_charge_to_menu_items',
  '',
  NULL,
  NOW(),
  1
) ON CONFLICT (id) DO NOTHING;
```

## ✅ Success Verification

Order submission is fixed when:

1. ✅ Debug endpoint shows "HEALTHY" status
2. ✅ Test order submission returns success
3. ✅ Real orders complete without errors
4. ✅ Orders appear in admin panel
5. ✅ No database errors in Vercel logs

## 📞 Next Steps

After fixing:
1. Test multiple order scenarios
2. Verify order data integrity
3. Test payment processing
4. Monitor Vercel function logs
5. Set up alerts for future issues

The enhanced debugging tools will help prevent and quickly diagnose similar issues in the future.