import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['MANAGER', 'EMPLOYEE']).optional()
})

// PATCH /api/admin/users/[id] - Update user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input data
    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { id } = params
    const updateData = validationResult.data

    // Check if user exists and is not admin
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify admin user' },
        { status: 403 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Soft delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if user exists and is not admin
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin user' },
        { status: 403 }
      )
    }

    // Soft delete by deactivating the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
