# 🐘 Neon PostgreSQL Setup for royal-food-rs.vercel.app

## 🚀 Quick Setup (5 minutes)

### Option A: Through Vercel (Easiest)
1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Project**: royal-food-rs
3. **Integrations**: Settings → Integrations → Search "Neon" → Add Integration
4. **Connect**: Follow the prompts to connect/create Neon database
5. **Copy Variables**: Go to Settings → Environment Variables
6. **Find**: `DATABASE_URL` (automatically added by Neon integration)

### Option B: Direct Neon Setup
1. **Visit**: https://neon.tech
2. **Sign Up**: Use GitHub/Google for quick signup
3. **Create Project**: Name it "royal-food-rs" 
4. **Get Connection String**: Dashboard → Connection Details → Pooled connection
5. **Copy**: The full PostgreSQL URL

## 📋 Your Neon Connection String Format

```bash
# Example (yours will have different values):
DATABASE_URL="postgresql://royal_food_user:AbC123XyZ789@ep-cool-meadow-12345678.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## ⚙️ Set in Vercel Environment Variables

1. **Dashboard**: vercel.com/dashboard → royal-food-rs
2. **Environment Variables**: Settings → Environment Variables
3. **Add Variable**:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string
   - **Environment**: Production, Preview, Development

## 🧪 Test Your Connection

After setting the DATABASE_URL:
1. **Deploy**: Push code or redeploy in Vercel
2. **Test**: Visit https://royal-food-rs.vercel.app/api/test-env
3. **Check**: Should show "✅ Connected" for database status

## 🔒 Security Notes

- ✅ Neon connections are SSL by default (`?sslmode=require`)
- ✅ Username/password are auto-generated (secure)
- ✅ Database is isolated to your project
- ⚠️ Never commit DATABASE_URL to Git

## 💡 Pro Tips

1. **Use Pooled Connection**: Better for serverless (Vercel)
2. **Database Name**: Usually "neondb" (default)
3. **Region**: US East 1 is closest to Vercel
4. **Backups**: Neon provides automatic backups

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "Connection refused" | Check if `?sslmode=require` is included |
| "Authentication failed" | Verify username/password in connection string |
| "Database not found" | Check database name (usually "neondb") |
| "Timeout" | Use pooled connection, not direct connection |

## ✅ Complete Environment Variables List

Set all 4 in Vercel:
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="https://royal-food-rs.vercel.app"
NEXTAUTH_SECRET="generate-32-char-string"
NODE_ENV="production"
```

## 🎯 Next Steps After Setup

1. Set DATABASE_URL in Vercel
2. Redeploy application
3. Visit `/api/test-env` to verify connection
4. Run `/api/init-db` to initialize database
5. Login and start using your app!
