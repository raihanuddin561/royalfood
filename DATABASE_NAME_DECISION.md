# 🔍 Database Name Verification Guide

## ❓ The Question
You created `royal_food_db` but the URL shows `neondb`. Which one should you use?

## ✅ Answer: Use the Database You Actually Created

### Step 1: Check What Databases Exist in Neon
1. **Login**: https://console.neon.tech
2. **Select Project**: Your royal-food project
3. **Databases Tab**: Look at the list of databases
4. **You Should See**: `royal_food_db` (the one you created)

### Step 2: Update the Connection String
Use `royal_food_db` in your DATABASE_URL:

```bash
# CORRECT (use your created database):
DATABASE_URL=postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require

# WRONG (default that may not exist):
DATABASE_URL=postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🧪 How to Test Which Database Name Works

### Method 1: Check Neon Console
1. **Neon Dashboard**: https://console.neon.tech
2. **Your Project**: Select it
3. **Databases Tab**: See actual database names

### Method 2: Test Connection
1. **Set DATABASE_URL** with `royal_food_db` in Vercel
2. **Deploy** your app
3. **Test**: https://royal-food-rs.vercel.app/api/test-env
4. **Check**: Database connection status

### Method 3: SQL Query (Advanced)
If you can connect, run:
```sql
\l
-- or
SELECT datname FROM pg_database;
```

## 📋 What Each Database Name Means

| Database Name | What It Is |
|---------------|------------|
| `neondb` | Neon's default database (may or may not exist) |
| `royal_food_db` | Your custom database (the one you created) |
| `main` | Another common default name |
| `postgres` | System database (don't use) |

## 🎯 Recommendation

**Use `royal_food_db`** because:
1. ✅ You specifically created it
2. ✅ Matches your local development (`royal_food_db`)
3. ✅ Consistent naming across environments
4. ✅ Avoids confusion with defaults

## 🛠️ Step-by-Step Fix

### 1. Update Your CONNECTION_URL
In Vercel Environment Variables, set:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```

### 2. Deploy and Test
1. **Redeploy** your Vercel app
2. **Visit**: https://royal-food-rs.vercel.app/api/test-env
3. **Should show**: "✅ Connected" for database

### 3. If It Fails
- Check if `royal_food_db` actually exists in Neon
- Create it if missing: Databases → New Database → `royal_food_db`
- Try again

## 💡 Pro Tip

**The database name in the URL must match an actual database in your Neon project.** Since you created `royal_food_db`, that's what you should use in the connection string.

## 🚫 Common Mistake

Don't use `neondb` just because Vercel shows it. Use the database you actually created: `royal_food_db`.
