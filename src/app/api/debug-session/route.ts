import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Check server session
    const session = await getServerSession(authOptions)
    
    // Check JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Get cookies from request
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('next-auth') || cookie.name.includes('session')
    )

    return NextResponse.json({
      success: true,
      sessionExists: !!session,
      tokenExists: !!token,
      sessionData: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        }
      } : null,
      tokenData: token ? {
        sub: token.sub,
        email: token.email,
        role: token.role,
        exp: token.exp,
        iat: token.iat
      } : null,
      cookies: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      })),
      environment: {
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL
      },
      headers: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent'),
        cookie: !!request.headers.get('cookie')
      }
    })

  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL
      }
    }, { status: 500 })
  }
}
