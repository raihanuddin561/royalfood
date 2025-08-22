# 🔧 Fix: PrismaClientConstructorValidationError - undefined datasource

## Error Details
```
Error [PrismaClientConstructorValidationError]: Invalid value undefined for datasource "db" provided to PrismaClient constructor.
```

## Root Cause
The `DATABASE_URL` environment variable is not accessible when Prisma tries to initialize the client.

## ✅ Fixes Applied

### 1. Enhanced Prisma Client (`src/lib/prisma.ts`)
- Added explicit DATABASE_URL validation
- Better error messages for debugging
- Removed explicit datasource URL (let Prisma use schema definition)

### 2. Environment Testing Endpoint (`/api/test-env`)
- Test all environment variables
- Verify database connectivity
- Debug deployment issues

### 3. Environment Validation Utility (`src/lib/env.ts`)
- Validate required environment variables
- Provide fallback values where appropriate

## 🚀 Deployment Solutions

### For Vercel Deployment

1. **Set Environment Variables in Vercel Dashboard**:
   ```bash
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   NEXTAUTH_URL=https://royal-food-rs.vercel.app
   NEXTAUTH_SECRET=your-32-character-secret
   NODE_ENV=production
   ```

2. **Generate NEXTAUTH_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Verify Environment Variables**:
   After deployment, visit: `https://royal-food-rs.vercel.app/api/test-env`

### For Other Hosting Platforms

1. **Railway**:
   - Add environment variables in Railway dashboard
   - Use PostgreSQL addon for database

2. **Netlify**:
   - Set environment variables in site settings
   - Use external PostgreSQL service (Neon, Supabase)

3. **Docker/Self-hosted**:
   - Use `.env` file or environment variables
   - Ensure DATABASE_URL is accessible to the Node.js process

## 🔍 Debugging Steps

### Step 1: Check Environment Variables
Visit `/api/test-env` to verify all environment variables are set correctly.

### Step 2: Test Database Connection
The test endpoint will also verify database connectivity.

### Step 3: Check Database URL Format
Ensure your DATABASE_URL follows this format:
```
postgresql://username:password@host:port/database?sslmode=require
```

### Step 4: Verify SSL Mode
For cloud databases (Neon, Supabase), always include `?sslmode=require`

## 📱 Quick Fixes

### Fix 1: Missing DATABASE_URL
```bash
# Add to your hosting platform's environment variables
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Fix 2: Incorrect URL Format
```bash
# Wrong
DATABASE_URL="postgres://user:pass@host/db"

# Correct
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Fix 3: Environment Loading Issues
If using Docker or custom deployment:
```bash
# Install dotenv
npm install dotenv

# Load environment in your app
require('dotenv').config()
```

## 🧪 Testing Your Fix

1. Deploy your application
2. Visit `/api/test-env` endpoint
3. Check for:
   - ✅ All environment variables present
   - ✅ Database connection successful
4. Test login at `/auth/signin`

## 📞 Still Having Issues?

Check the deployment logs for:
- `DATABASE_URL environment variable is not set`
- Connection timeout errors
- SSL certificate issues

Most issues are resolved by ensuring:
1. DATABASE_URL is correctly formatted
2. Environment variables are set in hosting platform
3. Database accepts connections from your hosting platform's IP ranges
