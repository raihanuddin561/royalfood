import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// SECURITY WARNING: Delete this endpoint after debugging!
export async function GET(request: NextRequest) {
  try {
    // Check what's actually in the database
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@royalfood.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        password: true // We need this for password testing
      }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: "Admin user not found in database",
        issue: "User doesn't exist"
      })
    }

    // Test password hashing
    const testPassword = '11food22'
    const passwordMatches = await bcrypt.compare(testPassword, adminUser.password)

    // Test different possible passwords
    const testPasswords = ['11food22', 'admin123', 'password123']
    const passwordTests = await Promise.all(
      testPasswords.map(async (pwd) => ({
        password: pwd,
        matches: await bcrypt.compare(pwd, adminUser.password)
      }))
    )

    return NextResponse.json({
      success: true,
      message: "Database user analysis",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: adminUser.createdAt,
        passwordHashPreview: adminUser.password.substring(0, 20) + '...'
      },
      passwordTests,
      primaryPasswordTest: {
        password: '11food22',
        matches: passwordMatches
      },
      recommendations: passwordMatches ? [
        "✅ Password hash is correct",
        "❓ Check if NextAuth configuration is working",
        "❓ Check if Prisma client is using the right database",
        "❓ Verify auth.ts is using correct user fields"
      ] : [
        "❌ Password hash doesn't match",
        "🔧 Need to reset admin password",
        "🔍 Check password hashing during user creation"
      ],
      warning: "⚠️ DELETE THIS ENDPOINT IMMEDIATELY AFTER DEBUGGING!"
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to debug user authentication'
    }, { status: 500 })
  }
}
