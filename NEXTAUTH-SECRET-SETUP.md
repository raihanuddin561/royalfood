# 🔐 NextAuth Secret Configuration Guide

## 🚨 Critical Fix Required

Your deployment is failing because `NEXTAUTH_SECRET` is not set in Vercel environment variables.

## 🔑 Generated Secret
**Your secure NextAuth secret:**
```
<REDACTED_NEXTAUTH_SECRET>
```

## ⚡ Quick Fix Steps

### Step 1: Set Environment Variable in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `royalfood` project
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. Click **Add New** button
6. Set:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: `<REDACTED_NEXTAUTH_SECRET>`
   - **Environment**: Select **Production**, **Preview**, and **Development**
7. Click **Save**

### Step 2: Redeploy
After adding the environment variable:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 🔧 All Required Environment Variables

Make sure these are ALL set in Vercel:

```bash
# Database
DATABASE_URL=postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASS>@<REDACTED_DB_HOST>/<REDACTED_DB_NAME>?sslmode=require

# NextAuth
NEXTAUTH_URL=https://royal-food-rs.vercel.app  
NEXTAUTH_SECRET=<REDACTED_NEXTAUTH_SECRET>

# Environment
NODE_ENV=production
```

## ✅ Verification
After redeployment:
1. Visit: `https://royal-food-rs.vercel.app`
2. Check that you don't see the NextAuth secret error
3. Try to access: `https://royal-food-rs.vercel.app/auth/signin`

## 🆘 If Still Having Issues
1. Check Vercel Function Logs for any remaining errors
2. Verify all environment variables are set correctly
3. Make sure NEXTAUTH_SECRET has no extra spaces or quotes

---

**This secret is unique to your deployment - keep it secure!**
