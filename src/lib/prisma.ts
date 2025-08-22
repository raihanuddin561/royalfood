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
DATABASE_URL environment variable is not set.

For local development, ensure you have a .env file with:
DATABASE_URL="postgresql://username:password@localhost:5432/database"

For production deployment, set the DATABASE_URL environment variable in your hosting platform.

Current NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
Available env vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'}
    `.trim()
    
    console.error(errorMessage)
    throw new Error('DATABASE_URL is not defined. Please check your environment variables.')
  }

  console.log(`Connecting to database with NODE_ENV: ${process.env.NODE_ENV}`)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
