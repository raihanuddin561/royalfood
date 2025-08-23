import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _prisma: PrismaClient | undefined

// Build-safe prisma client factory
function createPrismaClient(): PrismaClient | null {
  // Skip initialization during build if no DATABASE_URL_NEW
  if (!process.env.DATABASE_URL_NEW) {
    // During build phase or when DATABASE_URL_NEW is not available
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
      console.log('⚠️ Build phase detected, skipping Prisma client initialization')
      return null
    }
    
    const errorMessage = `
❌ DATABASE_URL_NEW environment variable is not set.

🔍 Debug Info:
- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
- NEXT_PHASE: ${process.env.NEXT_PHASE || 'undefined'}
- Platform: ${process.env.VERCEL ? 'Vercel' : 'Other'}
- Available DATABASE vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'}

📋 Solutions:
1. For Vercel: Set DATABASE_URL_NEW in Environment Variables
2. For local: Check your .env file
3. For other hosts: Verify environment variable is set

🔗 Expected format:
DATABASE_URL_NEW="postgresql://user:pass@host:5432/database?sslmode=require"
    `.trim()
    
    console.error(errorMessage)
    throw new Error('DATABASE_URL_NEW is not defined. Please check your environment variables.')
  }

  console.log(`✅ Creating Prisma client (NODE_ENV: ${process.env.NODE_ENV})`)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Lazy getter for Prisma client
function getPrismaClient(): PrismaClient {
  if (!_prisma) {
    const client = createPrismaClient()
    if (client === null) {
      // Return a mock client during build
      return {} as PrismaClient
    }
    
    _prisma = globalForPrisma.prisma ?? client
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma
    }
  }
  return _prisma
}

// Export a proxy that only initializes when actually used
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient()
    const value = client[prop as keyof PrismaClient]
    
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
  has(target, prop) {
    return prop in getPrismaClient()
  }
})
