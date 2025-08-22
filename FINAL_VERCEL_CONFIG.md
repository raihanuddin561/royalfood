# 🔑 EXACT Vercel Environment Variables for royal-food-rs

## Set these in Vercel Dashboard → royal-food-rs → Settings → Environment Variables

### 1. DATABASE_URL (Use the pooled connection - CORRECTED DATABASE NAME)
```
postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```

### 2. NEXTAUTH_URL
```
https://royal-food-rs.vercel.app
```

### 3. NEXTAUTH_SECRET (Generate your own)
Run this command to generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. NODE_ENV
```
production
```

## ⚠️ Security Recommendations

1. **Generate NEXTAUTH_SECRET**: Don't use example values
2. **Keep .env.production in Git**: It's OK since these are your actual production values
3. **Database Credentials**: These are secure Neon-generated credentials

## ✅ Ready to Deploy

Your configuration is perfect for production! The pooled connection will work optimally with Vercel's serverless environment.

## 🧪 Testing Steps

1. Set all 4 variables in Vercel
2. Deploy/redeploy your app
3. Visit: https://royal-food-rs.vercel.app/api/test-env
4. Should show: "✅ Connected" for database status
