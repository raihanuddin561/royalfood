import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find customer by email and phone
    const customer = await prisma.customer.findFirst({
      where: {
        email: validatedData.email,
        phone: validatedData.phone
      }
    })

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found. Please check your email and phone number or register a new account.'
      }, { status: 404 })
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
