import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for customer registration
const registerCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address (e.g., john@example.com)'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters (e.g., 123 Main St, City)').max(200, 'Address must be less than 200 characters'),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferences: z.string().optional() // JSON string for allergies, dietary preferences
})

// POST /api/public/customers/register - Customer registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = registerCustomerSchema.parse(body)
    
    // Check if customer already exists by email or phone
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone }
        ]
      }
    })
    
    if (existingCustomer) {
      return NextResponse.json({
        success: false,
        error: existingCustomer.email === validatedData.email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      }, { status: 400 })
    }
    
    // Hash the password before storing
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)
    
    // Create new customer
    const newCustomer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        address: validatedData.address,
        city: validatedData.city || null,
        zipCode: validatedData.zipCode || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        preferences: validatedData.preferences || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        dateOfBirth: true,
        preferences: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Customer registered successfully',
      customer: newCustomer
    }, { status: 201 })
    
  } catch (error) {
    console.error('Customer registration error:', error)
    
    if (error instanceof z.ZodError) {
      // Create user-friendly error messages
      const errorMessages = error.issues.map(issue => {
        switch (issue.path[0]) {
          case 'name':
            return `Name: ${issue.message}`
          case 'email':
            return `Email: ${issue.message}`
          case 'phone':
            return `Phone: ${issue.message}`
          case 'password':
            return `Password: ${issue.message}`
          case 'address':
            return `Address: ${issue.message}`
          default:
            return `${String(issue.path[0])}: ${issue.message}`
        }
      })
      
      return NextResponse.json({
        success: false,
        error: 'Registration information is invalid',
        message: errorMessages.join('. '),
        validationErrors: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to register customer'
    }, { status: 500 })
  }
}

// GET /api/public/customers/register - Check if customer exists (for login flow)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    
    if (!email && !phone) {
      return NextResponse.json({
        success: false,
        error: 'Email or phone is required'
      }, { status: 400 })
    }
    
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true
      }
    })
    
    return NextResponse.json({
      success: true,
      exists: !!customer,
      customer: customer || null
    })
    
  } catch (error) {
    console.error('Customer lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check customer'
    }, { status: 500 })
  }
}
