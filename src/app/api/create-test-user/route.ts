import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: `User ${email} already exists`,
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          id: existingUser.id
        }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create test user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Test user ${email} created successfully`,
      user: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        id: newUser.id
      }
    })

  } catch (error) {
    console.error('Test user creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
