# 🔧 VERCEL ENVIRONMENT VARIABLES FOR ORDER FIX

## Required Environment Variables for Order Submission Fix

Add these environment variables in your Vercel dashboard:

### 1. Database Connection
```env
DATABASE_URL_NEW=postgresql://user:pass@host:5432/royal_food_db?sslmode=require
```

### 2. Migration Secret (for quick fix)
```env
MIGRATION_SECRET=fix-order-submission-2024
```

### 3. NextAuth Configuration
```env
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://royal-food-rs.vercel.app
```

### 4. Optional Migration Token (for enhanced security)
```env
MIGRATION_ADMIN_TOKEN=your-migration-admin-token
```

## How to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Project**: royal-food-rs
3. **Go to Settings**: Click the "Settings" tab
4. **Environment Variables**: Click "Environment Variables" in sidebar
5. **Add Variables**: Click "Add New" for each variable above
6. **Set Environments**: Select Production, Preview, and Development
7. **Save**: Click "Save" after adding each variable
8. **Redeploy**: Trigger a new deployment after adding variables

## Quick Setup Commands

If you prefer using Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add DATABASE_URL_NEW
vercel env add MIGRATION_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Redeploy
vercel --prod
```

## Verification

After setting the environment variables, verify they're working:

```bash
# Check environment status
curl https://royal-food-rs.vercel.app/api/test-env

# Check migration status
curl https://royal-food-rs.vercel.app/api/fix-order-migration
```

## Sample .env.production (for reference)

```env
# Database
DATABASE_URL_NEW=postgresql://user:pass@host:5432/royal_food_db?sslmode=require

# Migration
MIGRATION_SECRET=fix-order-submission-2024
MIGRATION_ADMIN_TOKEN=admin-migration-token-2024

# NextAuth
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://royal-food-rs.vercel.app

# Optional
NODE_ENV=production
SKIP_ENV_VALIDATION=true
PRISMA_GENERATE_SKIP_POSTINSTALL_WARNING=true
```