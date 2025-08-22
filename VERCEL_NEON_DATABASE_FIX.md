# 🔧 Vercel-Neon Database Name Issue Fix

## ❗ The Problem
Vercel's Neon integration always shows `neondb` in the connection string, even when you have a custom database named `royal_food_db`.

## ✅ Solution: Manually Override in Vercel

### Step 1: Verify Your Database Exists
1. **Login to Neon**: https://console.neon.tech
2. **Select Project**: Find your royal-food project
3. **Check Databases Tab**: Look for `royal_food_db`
4. **If Missing**: Create it by clicking "New Database" → name it `royal_food_db`

### Step 2: Update Vercel Environment Variables
1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Select**: royal-food-rs project
3. **Go to**: Settings → Environment Variables
4. **Find**: DATABASE_URL
5. **Edit**: Click the pencil icon
6. **Replace**: Change `neondb` to `royal_food_db` in the URL

### Step 3: Correct DATABASE_URL Format
```bash
# Wrong (what Vercel shows):
postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Correct (what you should use):
postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```

## 🧪 How to Test Which Database Name is Correct

### Test Method 1: Check Neon Console
1. **Neon Dashboard**: https://console.neon.tech
2. **Your Project**: Select royal-food project
3. **Databases Tab**: Should show `royal_food_db` if it exists

### Test Method 2: SQL Query
Connect to your database and run:
```sql
SELECT current_database();
```

### Test Method 3: Use Vercel Test Endpoint
1. **Set DATABASE_URL** with `royal_food_db` in Vercel
2. **Deploy** your app
3. **Visit**: https://royal-food-rs.vercel.app/api/test-env
4. **Check**: Database connection status

## 💡 Why This Happens

- **Vercel Integration**: Auto-configures with default `neondb`
- **Custom Databases**: Not automatically detected by integration
- **Manual Override**: Required for custom database names

## ✅ Final Steps

1. **Confirm** `royal_food_db` exists in Neon
2. **Manually edit** DATABASE_URL in Vercel to use `royal_food_db`
3. **Deploy** and test connection
4. **Verify** at `/api/test-env` endpoint

## 📝 Alternative: Use neondb

If you prefer to keep things simple:
1. **Import your schema** into the default `neondb` database
2. **Use** the Vercel-generated connection string as-is
3. **Update** your local development to also use `neondb`
