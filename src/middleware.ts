import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware to avoid Edge Runtime conflicts
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
