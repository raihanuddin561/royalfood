# 🚀 FINAL Deployment Configuration - royal-food-rs.vercel.app

## ✅ Exact Environment Variables for Vercel

Copy these **exact values** to Vercel Dashboard → royal-food-rs → Settings → Environment Variables:

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```

### 2. NEXTAUTH_URL
```
https://royal-food-rs.vercel.app
```

### 3. NODE_ENV
```
production
```

### 4. NEXTAUTH_SECRET (Generate Your Own)
Run this command to generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Then use the output (example: `a1b2c3d4e5f67890...`)

## 📋 Step-by-Step Deployment

### Step 1: Set Environment Variables in Vercel
1. **Login**: https://vercel.com/dashboard
2. **Select**: royal-food-rs project
3. **Settings**: Click Settings tab
4. **Environment Variables**: Click Environment Variables
5. **Add Each Variable**: 
   - Click "Add New"
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require`
   - Environments: Production, Preview, Development
   - Save
   - Repeat for all 4 variables

### Step 2: Deploy
1. **Push Code**: `git push origin main` (if not already done)
2. **Or Redeploy**: In Vercel dashboard, click "Redeploy" on latest deployment

### Step 3: Initialize Database
1. **Visit**: https://royal-food-rs.vercel.app/api/init-db
2. **Should Show**: "Database initialized successfully!"
3. **Important**: Delete `/src/app/api/init-db/route.ts` file after running once

### Step 4: Test Everything
1. **Environment Check**: https://royal-food-rs.vercel.app/api/test-env
2. **Login Page**: https://royal-food-rs.vercel.app/auth/signin
3. **Admin Login**: 
   - Email: `admin@royalfood.com`
   - Password: `admin123`
4. **Change Password**: Immediately after first login

## 🎯 Expected Results

### At /api/test-env:
```json
{
  "environment": {
    "DATABASE_URL": "✅ Set",
    "NODE_ENV": "✅ production", 
    "NEXTAUTH_URL": "✅ Set",
    "NEXTAUTH_SECRET": "✅ Set"
  },
  "database": {
    "status": "✅ Connected"
  }
}
```

### At /api/init-db (run once only):
```json
{
  "message": "Database initialized successfully!",
  "success": true,
  "adminEmail": "admin@royalfood.com",
  "adminPassword": "admin123",
  "warning": "Change the admin password immediately after first login!"
}
```

## 🔒 Security Checklist
- [ ] All environment variables set in Vercel
- [ ] NEXTAUTH_SECRET is unique (not example)
- [ ] Database initialized with /api/init-db
- [ ] Admin password changed from default
- [ ] /api/init-db endpoint deleted after use

## 🎉 Final URLs
- **Main App**: https://royal-food-rs.vercel.app
- **Login**: https://royal-food-rs.vercel.app/auth/signin
- **Dashboard**: https://royal-food-rs.vercel.app/dashboard (after login)

Your Royal Food Restaurant Management System is now ready for production use!
