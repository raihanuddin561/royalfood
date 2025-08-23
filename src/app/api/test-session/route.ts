import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get session',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
