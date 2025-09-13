import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: {
        email: validatedData.email
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        address: true,
        dateOfBirth: true,
        preferences: true
      }
    })

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, customer.password)
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        dateOfBirth: customer.dateOfBirth?.toISOString(),
        preferences: customer.preferences
      }
    })

  } catch (error) {
    console.error('Customer login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 })
  }
}
