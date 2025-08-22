# 🔑 EXACT Environment Variables for Vercel Dashboard

## Copy these to: vercel.com/dashboard → royal-food-rs → Settings → Environment Variables

### 1. DATABASE_URL
```
postgresql://your-username:your-password@ep-xxxxx.us-east-1.aws.neon.tech/your-database?sslmode=require
```
**Note**: Replace with your actual Neon PostgreSQL connection string

### 2. NEXTAUTH_URL
```
https://royal-food-rs.vercel.app
```

### 3. NEXTAUTH_SECRET
Generate with this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Then paste the generated string (something like):
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 4. NODE_ENV
```
production
```

## 🚀 After Setting Variables

1. **Redeploy** your app in Vercel
2. **Visit**: https://royal-food-rs.vercel.app/api/test-env (to verify all variables are set)
3. **Initialize DB**: https://royal-food-rs.vercel.app/api/init-db (run once only)
4. **Login**: https://royal-food-rs.vercel.app/auth/signin with `admin@royalfood.com` / `admin123`
5. **Change Password** immediately after first login

## ✅ Quick Checklist
- [ ] Set DATABASE_URL in Vercel
- [ ] Set NEXTAUTH_URL to `https://royal-food-rs.vercel.app`
- [ ] Generate and set NEXTAUTH_SECRET
- [ ] Set NODE_ENV to `production`
- [ ] Redeploy
- [ ] Test at `/api/test-env`
- [ ] Initialize database at `/api/init-db`
- [ ] Login and change password
