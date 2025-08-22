import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin, type AuthenticatedRequest } from '@/lib/api-protection'

// Validation schema for user creation
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  employeeId: z.string().min(1, 'Employee ID is required'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  salary: z.number().min(0, 'Salary must be positive')
})

// GET /api/admin/users - Get all users (Admin only)
async function getUsersHandler(request: AuthenticatedRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        employeeProfile: {
          select: {
            employeeId: true,
            position: true,
            department: true,
            salary: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user (Admin only)
async function createUserHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = createUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, name, password, role, employeeId, position, department, salary } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      )
    }

    // Hash password with bcrypt (cost factor 12 for security)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and employee profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          isActive: true
        }
      })

      // Create employee profile
      await tx.employee.create({
        data: {
          userId: user.id,
          employeeId,
          position,
          department,
          salary,
          hireDate: new Date()
        }
      })

      return user
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        eventType: 'USER_CREATED',
        description: `User ${email} created by admin ${request.user.email}`,
        userId: request.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Return user data without password
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    }

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'User with this email or employee ID already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply authentication protection
export const GET = requireAdmin(getUsersHandler)
export const POST = requireAdmin(createUserHandler)
