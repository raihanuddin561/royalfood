# 🚀 Quick Vercel Deployment Guide

## ✅ Pre-Deployment Checklist
- [x] Project cleaned and optimized
- [x] Build configuration optimized
- [x] Unnecessary dependencies removed
- [x] Environment variables template ready

## �️ Deployment Steps (5 minutes)

### 1. Setup Neon Database (2 minutes)
1. Go to [neon.tech](https://neon.tech) → Sign up/Login
2. Click "Create Project" → Enter project name: "royal-food-db"
3. Copy the connection string (starts with `postgresql://`)

### 2. Deploy to Vercel (2 minutes)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Select your repository
4. Add these environment variables:
   ```
   DATABASE_URL = your-neon-connection-string
   NEXTAUTH_URL = https://your-app-name.vercel.app  
   NEXTAUTH_SECRET = any-random-32-character-string
   NODE_ENV = production
   ```
5. Click Deploy

### 3. Initialize Database (1 minute)
After deployment succeeds:
1. Go to your Vercel project → Functions tab
2. Create a temporary API endpoint at `/api/init-db.ts`:
```typescript
import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Run database setup
    await execAsync('npx prisma db push --accept-data-loss')
    await execAsync('npx tsx prisma/seed.ts')
    
    return Response.json({ success: true, message: 'Database initialized' })
  } catch (error) {
    return Response.json({ success: false, error: error.message })
  }
}
```
3. Visit `https://your-app.vercel.app/api/init-db` once
4. Delete the `/api/init-db.ts` file

## 🔑 Default Login
- **Email**: admin@royalfood.com
- **Password**: admin123

## ✅ That's it!
Your restaurant management system is now live and ready to use.

## 🆘 If Build Fails
Check Vercel build logs for specific errors. Common fixes:
- Verify all environment variables are set correctly
- Ensure DATABASE_URL format is correct
- Check for TypeScript errors in the code

---
**Total time: ~5 minutes** ⚡
