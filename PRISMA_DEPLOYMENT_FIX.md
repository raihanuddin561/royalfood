# 🔧 Prisma Deployment Error Fix

## Error: "Prisma schema validation - (get-config wasm)"

This error typically occurs during Vercel deployment when Prisma can't properly validate the schema in a serverless environment.

### ✅ Fixes Applied

1. **Updated Vercel Configuration** (`vercel.json`):
   - Simplified build command to avoid database operations during build
   - Added environment variables for Prisma optimization

2. **Updated Prisma Schema** (`prisma/schema.prisma`):
   - Added binary targets for serverless compatibility
   - Optimized for Vercel's build environment

3. **Updated Build Scripts** (`package.json`):
   - Removed `prisma db push` from build command (this should be done separately)
   - Simplified vercel-build script

### 🚀 Deployment Steps

1. **Set Environment Variables in Vercel**:
   ```bash
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="https://royal-food-rs.vercel.app"
   NEXTAUTH_SECRET="your-32-char-secret"
   NODE_ENV="production"
   ```

2. **Deploy the Application**:
   - Push your code to GitHub
   - Import project in Vercel
   - Set environment variables
   - Deploy

3. **Initialize Database** (One-time setup):
   After successful deployment, run this once:
   ```bash
   # In Vercel's Function tab or locally with production DATABASE_URL
   npx prisma db push
   npx prisma db seed
   ```

### 🔍 Common Causes & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `get-config wasm` | WASM binary issues in serverless | Added `binaryTargets` to schema |
| Build timeout | Database operations in build | Removed `db push` from build script |
| Connection issues | Wrong DATABASE_URL format | Use connection string with `?sslmode=require` |
| Auth errors | Missing NEXTAUTH_SECRET | Generate 32-character secret |

### 📝 Environment Variable Template

Copy to Vercel dashboard:
```bash
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NEXTAUTH_URL=https://royal-food-rs.vercel.app
NEXTAUTH_SECRET=generate-with-crypto-randomBytes-32-toString-hex
NODE_ENV=production
```

### 🔐 Generate NEXTAUTH_SECRET

Run locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ⚡ Quick Test

After deployment:
1. Visit your app URL
2. Go to `/auth/signin`
3. Login with: `admin@royalfood.com` / `admin123`
4. Change password immediately

### 🆘 If Still Failing

1. Check Vercel build logs for specific errors
2. Ensure DATABASE_URL is correctly formatted
3. Verify all environment variables are set
4. Try deploying without database operations first
