import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Function to create Prisma client with proper error handling
function createPrismaClient() {
  // Check if DATABASE_URL is available
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    const errorMessage = `
❌ DATABASE_URL environment variable is not set.

🔍 Debug Info:
- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
- Platform: ${process.env.VERCEL ? 'Vercel' : 'Other'}
- Available DATABASE vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'}
- All env vars starting with DB: ${Object.keys(process.env).filter(k => k.startsWith('DB')).join(', ') || 'none'}

📋 Solutions:
1. For Vercel: Set DATABASE_URL in Environment Variables
2. For local: Check your .env file
3. For other hosts: Verify environment variable is set

🔗 Expected format:
DATABASE_URL="postgresql://user:pass@host:5432/database?sslmode=require"
    `.trim()
    
    console.error(errorMessage)
    throw new Error('DATABASE_URL is not defined. Please check your environment variables.')
  }

  console.log(`✅ DATABASE_URL found, connecting to database (NODE_ENV: ${process.env.NODE_ENV})`)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
