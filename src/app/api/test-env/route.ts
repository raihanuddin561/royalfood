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
      NODE_ENV: nodeEnv ? `✅ ${nodeEnv}` : '❌ Missing',
      NEXTAUTH_URL: nextAuthUrl ? '✅ Set' : '❌ Missing',
      NEXTAUTH_SECRET: nextAuthSecret ? '✅ Set' : '❌ Missing'
    }

    // Additional debugging info
    const debugInfo = {
      platform: process.env.VERCEL ? 'Vercel' : 'Other',
      databaseUrlLength: databaseUrl ? databaseUrl.length : 0,
      databaseUrlPrefix: databaseUrl ? databaseUrl.substring(0, 15) + '...' : 'Not set',
      allDatabaseVars: Object.keys(process.env).filter(k => k.includes('DATABASE')),
      totalEnvVars: Object.keys(process.env).length
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
      dbStatus = `❌ Failed: ${dbError}`
    }

    return NextResponse.json({
      message: 'Environment & Database Check',
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      debug: debugInfo,
      timestamp: new Date().toISOString(),
      recommendations: databaseUrl ? [] : [
        'Set DATABASE_URL in Vercel Environment Variables',
        'Ensure it starts with postgresql://',
        'Redeploy after setting variables'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      message: 'Environment check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      troubleshooting: [
        'Check if DATABASE_URL is set in Vercel dashboard',
        'Verify the connection string format',
        'Try redeploying the application'
      ]
    }, { status: 500 })
  }
}
