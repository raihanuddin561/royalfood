import { NextRequest, NextResponse } from 'next/server'

// Test database connection endpoint
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL
    const nodeEnv = process.env.NODE_ENV
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET

    const envCheck = {
      DATABASE_URL: databaseUrl ? '✅ Set' : '❌ Missing',
      NODE_ENV: nodeEnv ? '✅ Set' : '❌ Missing',
      NEXTAUTH_URL: nextAuthUrl ? '✅ Set' : '❌ Missing',
      NEXTAUTH_SECRET: nextAuthSecret ? '✅ Set' : '❌ Missing'
    }

    // Try to import and test Prisma
    let dbStatus = '❌ Not Connected'
    let dbError = null

    try {
      const { prisma } = await import('@/lib/prisma')
      
      // Test database connection
      await prisma.$connect()
      await prisma.$disconnect()
      
      dbStatus = '✅ Connected'
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown database error'
    }

    return NextResponse.json({
      message: 'Environment Check',
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      message: 'Environment check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
