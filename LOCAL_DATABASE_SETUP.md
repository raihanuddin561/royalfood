# 🔧 Local PostgreSQL Setup for Royal Food Development

## Problem
Your application is trying to connect to PostgreSQL at `localhost:5432` but PostgreSQL isn't running locally.

## Quick Solutions

### Option A: Use Cloud Database (Recommended)
1. **Get Neon URL**: Go to https://console.neon.tech → Your Project → Connection String
2. **Update .env**: Replace the localhost URL with your Neon URL:
   ```bash
   # Change this line in your .env file:
   DATABASE_URL="postgresql://royal_food_user:royal_food_user_123@localhost:5432/royal_food_db"
   
   # To this (with your actual Neon credentials):
   DATABASE_URL="postgresql://your_username:your_password@ep-xxx.neon.tech/royal_food_db?sslmode=require"
   ```

### Option B: Install PostgreSQL Locally
1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install**: Use default settings, remember the password you set
3. **Create Database**: 
   ```bash
   # Open Command Prompt as Administrator
   createdb -U postgres royal_food_db
   ```
4. **Update .env**: Update the password in your current DATABASE_URL

### Option C: Use Docker (If you have Docker)
```bash
# Run PostgreSQL in Docker
docker run --name royal-food-postgres \
  -e POSTGRES_USER=royal_food_user \
  -e POSTGRES_PASSWORD=royal_food_user_123 \
  -e POSTGRES_DB=royal_food_db \
  -p 5432:5432 \
  -d postgres:15

# Your current .env DATABASE_URL will work with this
```

## Quick Test
After setting up your database, test the connection:
```bash
npm run dev
```

## Recommended: Use Cloud Database
For development, using a cloud database (Neon) is easier because:
- ✅ No local installation needed
- ✅ Same environment as production
- ✅ Automatic backups
- ✅ No port conflicts
- ✅ Works from anywhere

## Get Your Neon Database URL
1. Visit: https://console.neon.tech
2. Select your project
3. Go to "Connection Details"
4. Copy the "Pooled connection" string
5. Replace localhost URL in .env with this string

## Need Help?
If you share your Neon connection string (remove password), I can help you format it correctly for your .env file.