# 🚨 DATABASE_URL Error Fix Guide

## ❌ Error: "DATABASE_URL is not defined. Please check your environment variables."

This error means Vercel cannot find the `DATABASE_URL` environment variable.

## 🔍 Step 1: Check Vercel Environment Variables

### Go to Vercel Dashboard:
1. **Login**: https://vercel.com/dashboard
2. **Select**: royal-food-rs project
3. **Settings**: Click Settings tab
4. **Environment Variables**: Check if `DATABASE_URL` exists
5. **Verify Value**: Should start with `postgresql://`

### Expected Variables in Vercel:
```bash
If missing or wrong, add/edit with this exact value:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```
NEXTAUTH_URL=https://royal-food-rs.vercel.app
NEXTAUTH_SECRET=your-32-character-secret
NODE_ENV=production
```

## 🛠️ Step 2: Set DATABASE_URL in Vercel

### If Missing - Add New Variable:
1. **Click**: "Add New" in Environment Variables
2. **Name**: `DATABASE_URL`
3. **Value**: Your Neon connection string (see above)
4. **Environments**: Select Production, Preview, Development
5. **Save**: Click Save

### If Exists but Wrong - Edit Variable:
1. **Find**: DATABASE_URL in the list
2. **Click**: Edit (pencil icon)
3. **Update**: Paste correct connection string
4. **Save**: Click Save

## 🔗 Get Your Correct DATABASE_URL

### From Your .env.production File:
```bash
postgresql://neondb_owner:npg_DQgjylRpM28N@ep-broad-moon-ad0ctzai-pooler.c-2.us-east-1.aws.neon.tech/royal_food_db?sslmode=require
```

### From Neon Console:
1. **Login**: https://console.neon.tech
2. **Project**: Select your project
3. **Connection Details**: Copy the pooled connection string
4. **Replace**: Database name with `royal_food_db`

## 🚀 Step 3: Redeploy After Setting Variables

### Trigger New Deployment:
1. **Option A**: Push a new commit to trigger auto-deploy
2. **Option B**: Manual redeploy in Vercel dashboard
3. **Option C**: Click "Redeploy" on latest deployment

## 🧪 Step 4: Test the Fix

### Check Environment Variables:
Visit: https://royal-food-rs.vercel.app/api/test-env

Should show:
```json
{
  "environment": {
    "DATABASE_URL": "✅ Set",
    "NODE_ENV": "✅ Set",
    "NEXTAUTH_URL": "✅ Set",
    "NEXTAUTH_SECRET": "✅ Set"
  },
  "database": {
    "status": "✅ Connected"
  }
}
```

### If Still Failing:
1. **Check Vercel Build Logs**: Look for environment variable errors
2. **Verify Spelling**: DATABASE_URL (not Database_URL)
3. **Check All Environments**: Set for Production, Preview, Development
4. **Clear Cache**: Sometimes Vercel needs cache clearing

## 📋 Common Causes & Solutions

| Issue | Cause | Solution |
|-------|--------|----------|
| Variable not set | Missing in Vercel dashboard | Add DATABASE_URL variable |
| Wrong database name | Using `neondb` instead of `royal_food_db` | Edit URL to use correct DB name |
| Wrong format | Missing `postgresql://` prefix | Use correct PostgreSQL URL format |
| Deployment cache | Old deployment cached | Redeploy or clear cache |
| Environment scope | Not set for production | Select all environments when adding |

## 🆘 Quick Fix Checklist

- [ ] DATABASE_URL exists in Vercel Environment Variables
- [ ] Value starts with `postgresql://`
- [ ] Database name is `royal_food_db` (not `neondb`)
- [ ] Variable is set for Production environment
- [ ] Redeployed after setting variable
- [ ] Tested at `/api/test-env` endpoint

## 💡 Alternative: Use Vercel Postgres

If you continue having issues with Neon, consider:
1. **Vercel Postgres**: Built-in database solution
2. **Automatic Setup**: No manual environment variable configuration
3. **Seamless Integration**: Works out of the box
