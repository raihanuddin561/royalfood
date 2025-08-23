import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname);
  
  // Check if this is an API route or auth route
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/auth/')) {
    console.log('Skipping middleware for API/auth route');
    return NextResponse.next()
  }

  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    console.log('Middleware - Path:', request.nextUrl.pathname);
    console.log('Middleware - Token exists:', !!token);
    if (token) {
      console.log('Middleware - User:', token.email, 'Role:', token.role);
    }

    // If accessing protected routes without token, redirect to signin
    const protectedPaths = ['/dashboard', '/admin', '/inventory', '/menu', '/orders', '/sales', '/employees', '/expenses', '/reports', '/partnership', '/settings', '/operations']
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !token) {
      console.log('Protected path without token, redirecting to signin');
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Temporarily disable auth page redirects to fix login issue
    // if (request.nextUrl.pathname.startsWith('/auth/signin') && token) {
    //   console.log('User has valid token, redirecting from signin to dashboard');
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }

    // Add security headers
    const response = NextResponse.next()
    
    // Set secure cookie headers for session persistence
    if (token) {
      response.headers.set('X-User-Role', token.role as string || 'EMPLOYEE')
      response.headers.set('X-User-ID', token.sub || '')
    }
    
    return response

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
