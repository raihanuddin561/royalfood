# 🔍 Database Name Verification for Neon

## ❓ The Issue
Your local development uses `royal_food_db` but the Neon URL shows `neondb`. We need to use the correct database name.

## ✅ How to Verify the Correct Database Name

### Option 1: Check Neon Console
1. **Login to Neon**: https://console.neon.tech
2. **Select Project**: royal-food-rs (or your project name)
3. **Check Database Tab**: Look for the actual database name
4. **Common Names**:
   - `neondb` (Neon's default)
   - `royal_food_db` (your preferred name)
   - `main` (another common default)

### Option 2: Test Both Names
Try connecting with both database names and see which works:

**With neondb:**
```
postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASS>@<REDACTED_DB_HOST>/<REDACTED_DB_NAME>?sslmode=require
```

**With royal_food_db:**
```
postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASS>@<REDACTED_DB_HOST>/<REDACTED_DB_NAME>?sslmode=require
```

## 🛠️ How to Create the Correct Database

If `royal_food_db` doesn't exist in Neon, you can create it:

### In Neon Console:
1. **Go to**: https://console.neon.tech
2. **Select Project**: your royal-food-rs project
3. **Databases Tab**: Click "New Database"
4. **Name**: `royal_food_db`
5. **Create**: Click create button

### Or Use SQL:
Connect to Neon and run:
```sql
CREATE DATABASE royal_food_db;
```

## ✅ Updated Connection String

I've updated your `.env.production` to use `royal_food_db`. For Vercel, use:

```bash
DATABASE_URL=postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASS>@<REDACTED_DB_HOST>/<REDACTED_DB_NAME>?sslmode=require
```

## 🧪 Testing

After setting the correct DATABASE_URL in Vercel:
1. **Deploy** your app
2. **Visit**: https://royal-food-rs.vercel.app/api/test-env
3. **Check**: Database connection status

## 💡 Recommendation

**Use `royal_food_db`** to match your local development environment. This ensures consistency between local and production.
