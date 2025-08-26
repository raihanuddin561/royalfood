# 🔑 EXACT Vercel Environment Variables for royal-food-rs

## Set these in Vercel Dashboard → royal-food-rs → Settings → Environment Variables

### 1. DATABASE_URL (Use the pooled connection - FINAL CORRECT URL)
```
postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASS>@<REDACTED_DB_HOST>/<REDACTED_DB_NAME>?sslmode=require
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
2. **Do NOT commit `.env.production` to Git.** Keep production secrets in your hosting provider's environment settings or a secrets manager.
3. **Database Credentials**: These are secure Neon-generated credentials

## ✅ Ready to Deploy

Your configuration is perfect for production! The pooled connection will work optimally with Vercel's serverless environment.

## 🧪 Testing Steps

1. Set all 4 variables in Vercel
2. Deploy/redeploy your app
3. Visit: https://royal-food-rs.vercel.app/api/test-env
4. Should show: "✅ Connected" for database status
