# 🚀 Deployment Checklist for royal-food-rs.vercel.app

## ✅ Environment Variables to Set in Vercel Dashboard

Go to: https://vercel.com/dashboard → royal-food-rs → Settings → Environment Variables

Add these variables:

| Variable | Value | Notes |
|----------|--------|-------|
| `DATABASE_URL` | `postgresql://username:password@host/db?sslmode=require` | From Neon PostgreSQL |
| `NEXTAUTH_URL` | `https://royal-food-rs.vercel.app` | Your domain (exact) |
| `NEXTAUTH_SECRET` | Generate with crypto | 32-character string |
| `NODE_ENV` | `production` | Environment type |

## 🔐 Generate NEXTAUTH_SECRET

Run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

## 📋 Deployment Steps

1. **Set Environment Variables**: Add all 4 variables above in Vercel dashboard
2. **Deploy**: Push code or redeploy in Vercel
3. **Initialize Database**: Visit `https://royal-food-rs.vercel.app/api/init-db` (once only)
4. **Test Login**: Visit `https://royal-food-rs.vercel.app/auth/signin`
5. **Change Password**: Login with `admin@royalfood.com` / `admin123` and change password
6. **Delete Init Endpoint**: Remove `/src/app/api/init-db/route.ts` for security

## 🧪 Testing URLs

- **Main App**: https://royal-food-rs.vercel.app
- **Login**: https://royal-food-rs.vercel.app/auth/signin
- **Environment Test**: https://royal-food-rs.vercel.app/api/test-env
- **Database Init**: https://royal-food-rs.vercel.app/api/init-db (use once, then delete)

## ⚠️ Security Notes

1. **Change Default Password**: The default admin password `admin123` must be changed immediately
2. **Delete Init Endpoint**: Remove `/api/init-db` after first use
3. **Secure Environment Variables**: Never commit real values to Git

## 🔧 Troubleshooting

If deployment fails:
1. Check Vercel build logs
2. Verify all 4 environment variables are set correctly
3. Test environment at `/api/test-env`
4. Ensure DATABASE_URL has `?sslmode=require`

## 📞 Support

Your app domain: **royal-food-rs.vercel.app**
All configuration has been updated for this specific domain.
