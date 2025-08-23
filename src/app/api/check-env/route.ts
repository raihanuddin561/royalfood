import { NextRequest, NextResponse } from 'next/server'

// Simple endpoint to check if environment variables are set
export async function GET(request: NextRequest) {
  try {
    const databaseUrlNew = process.env.DATABASE_URL_NEW
    const databaseUrl = process.env.DATABASE_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
        DATABASE_URL_EXISTS: !!databaseUrl,
        DATABASE_URL_NEW_EXISTS: !!databaseUrlNew,
        DATABASE_URL_NEW_PREVIEW: databaseUrlNew ? 
          `${databaseUrlNew.substring(0, 30)}...${databaseUrlNew.substring(databaseUrlNew.length - 30)}` : 
          'NOT SET',
        NEXTAUTH_SECRET_EXISTS: !!nextAuthSecret,
        NEXTAUTH_SECRET_LENGTH: nextAuthSecret?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set (will auto-detect)',
        HOST_URL: request.headers.get('host'),
        PROTOCOL: request.url.startsWith('https://') ? 'https' : 'http'
      },
      recommendations: [
        databaseUrlNew ? '✅ DATABASE_URL_NEW is set' : '❌ Add DATABASE_URL_NEW in Vercel',
        nextAuthSecret && nextAuthSecret.length >= 32 ? '✅ NEXTAUTH_SECRET is strong' : '❌ Set NEXTAUTH_SECRET (32+ chars)',
        process.env.NEXTAUTH_URL ? '✅ NEXTAUTH_URL is set' : '⚠️ Consider setting NEXTAUTH_URL for production',
        process.env.NODE_ENV === 'production' ? '✅ Production environment' : '⚠️ Development environment'
      ],
      message: databaseUrlNew && nextAuthSecret ? 
        'Core environment variables are properly set!' : 
        'Some environment variables need attention.',
      warning: "⚠️ Delete this endpoint after debugging for security!"
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check environment variables'
    }, { status: 500 })
  }
}
