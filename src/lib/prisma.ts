import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Function to create Prisma client with proper error handling
function createPrismaClient() {
  // During build time, we might not have DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL

  if (!databaseUrl && !isBuildTime) {
    const errorMessage = `
❌ DATABASE_URL environment variable is not set.

🔍 Debug Info:
- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
- Platform: ${process.env.VERCEL ? 'Vercel' : 'Other'}
- Build time: ${isBuildTime}
- Available DATABASE vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'}

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

  // During build, return a mock client
  if (!databaseUrl && isBuildTime) {
    console.log('⚠️ Build time detected, using placeholder Prisma client')
    // Return a basic PrismaClient that won't actually connect
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://build:build@localhost:5432/build'
        }
      }
    })
  }

  console.log(`✅ DATABASE_URL found, creating Prisma client (NODE_ENV: ${process.env.NODE_ENV})`)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Create client instance
const createClient = () => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  const client = createPrismaClient()
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  
  return client
}

export const prisma = createClient()
