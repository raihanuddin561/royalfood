import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files, API routes, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Only protect specific routes
  const protectedPaths = ['/dashboard', '/admin', '/inventory', '/menu', '/orders', '/sales', '/employees', '/expenses', '/reports', '/partnership', '/settings', '/operations']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (!isProtectedPath) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      // Try to get token with more lenient settings for refresh scenarios
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    })

    if (!token) {
      // Check if this is likely a page refresh by looking at the referer
      const referer = request.headers.get('referer')
      const isPageRefresh = referer && new URL(referer).pathname === pathname
      
      if (isPageRefresh) {
        // For page refreshes, allow the request to go through and let client-side handle it
        // This prevents the refresh redirect issue
        return NextResponse.next()
      }
      
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
