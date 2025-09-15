# 🚨 Quick Database Connection Fix

## Problem
Your app is trying to connect to PostgreSQL at `localhost:5432` but the user `royal_food_user` doesn't exist or has wrong credentials.

## 🎯 Quick Solutions (Choose One)

### Option A: Use Neon Database (RECOMMENDED - 2 minutes)

1. **Go to Neon Console**: https://console.neon.tech
2. **Create/Use Database**: Create a new database or use existing
3. **Get Connection String**: Copy the "Pooled connection" string
4. **Update .env file**: Replace this line:
   ```bash
   # Change this:
   DATABASE_URL="postgresql://royal_food_user:royal_food_user_123@localhost:5432/royal_food_db"
   
   # To this (with your actual Neon credentials):
   DATABASE_URL="postgresql://your_user:your_pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```
5. **Test**: Run `npm run dev` - should work immediately!

### Option B: Fix Local PostgreSQL (5 minutes)

1. **Reset PostgreSQL password**:
   ```powershell
   # Stop PostgreSQL service
   net stop postgresql-x64-17
   
   # Start in single-user mode (run as administrator)
   # Then connect and reset password
   ```

2. **Or use different credentials** - Update .env to use postgres user:
   ```bash
   DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/postgres"
   ```

### Option C: Quick Docker Solution (If you have Docker)

```powershell
# Run PostgreSQL with exact credentials from your .env
docker run --name royal-food-db -e POSTGRES_USER=royal_food_user -e POSTGRES_PASSWORD=royal_food_user_123 -e POSTGRES_DB=royal_food_db -p 5432:5432 -d postgres:15
```

## 🔥 FASTEST FIX: Use Neon

Just get your Neon database URL and replace the DATABASE_URL in .env. That's it!

Your Neon URL should look like:
```
postgresql://username:password@ep-proud-butterfly-12345678.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## ✅ Test Your Fix

After updating DATABASE_URL:
```bash
npm run dev
```

Visit: http://localhost:3000 - should work without database errors!

## Need Your Neon URL?

If you need help getting your Neon database URL:
1. Share your Neon project name 
2. I'll help you format the connection string properly

## 📞 Quick Help

Just copy your Neon connection string and replace the DATABASE_URL in your .env file. Your app will connect immediately!