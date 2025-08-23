import { NextRequest, NextResponse } from 'next/server'

// Simple endpoint to check if DATABASE_URL_NEW is set
export async function GET(request: NextRequest) {
  try {
    const databaseUrlNew = process.env.DATABASE_URL_NEW
    const databaseUrl = process.env.DATABASE_URL
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL_EXISTS: !!databaseUrl,
        DATABASE_URL_NEW_EXISTS: !!databaseUrlNew,
        DATABASE_URL_NEW_PREVIEW: databaseUrlNew ? 
          `${databaseUrlNew.substring(0, 30)}...${databaseUrlNew.substring(databaseUrlNew.length - 30)}` : 
          'NOT SET',
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      },
      message: databaseUrlNew ? 
        'DATABASE_URL_NEW is properly set!' : 
        'DATABASE_URL_NEW is missing! Add it in Vercel Environment Variables.',
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
