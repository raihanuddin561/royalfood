import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-protection'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return requireAdmin(async (request: any) => {
    try {
      const { prisma } = await import('@/lib/prisma')
      const body = await req.json()
      const { partnerId } = body

      // If partnerId is provided, verify partner exists
      if (partnerId) {
        const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
        if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
        if (!partner.isActive) return NextResponse.json({ error: 'Partner is inactive' }, { status: 400 })
      }

      const updated = await prisma.user.update({
        where: { id: params.id },
        data: { partnerId: partnerId ?? null },
        select: { id: true, email: true, name: true, partnerId: true }
      })

      return NextResponse.json({ user: updated })
    } catch (err) {
      console.error('Error updating user partner:', err)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
  })(null as any)
}

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic runtime to prevent build-time evaluation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['MANAGER', 'EMPLOYEE']).optional(),
  partnerId: z.string().nullable().optional()
})

// PATCH /api/admin/users/[id] - Update user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Import prisma inside the function to avoid build-time initialization
    const { prisma } = await import('@/lib/prisma')
    
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
  const updateData = validationResult.data as any

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

    // If partnerId exists in request, validate partner
    if (updateData.partnerId !== undefined) {
      if (updateData.partnerId === null) {
        // unassign partner
      } else {
        const partner = await prisma.partner.findUnique({ where: { id: updateData.partnerId } })
        if (!partner) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
        }
        if (!partner.isActive) {
          return NextResponse.json({ error: 'Partner is inactive' }, { status: 400 })
        }
      }
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
        partnerId: true,
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
    // Import prisma inside the function to avoid build-time initialization
    const { prisma } = await import('@/lib/prisma')
    
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
