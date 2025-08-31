import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

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
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()

    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 })

    const updateData = validation.data as any
    const { id } = params

    // Ensure user exists
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // For safety: disallow modifying admin users except for partner assignment.
    // If the existing user is ADMIN and the request attempts to modify fields other than partnerId, reject.
    const keysBeingUpdated = Object.keys(updateData || {})
    const onlyPartnerUpdate = keysBeingUpdated.length === 1 && keysBeingUpdated[0] === 'partnerId'
    if (existingUser.role === 'ADMIN' && !onlyPartnerUpdate) {
      return NextResponse.json({ error: 'Cannot modify admin user' }, { status: 403 })
    }

    // If partnerId provided, validate partner
    if (updateData.partnerId !== undefined) {
      if (updateData.partnerId !== null) {
        const partner = await prisma.partner.findUnique({ where: { id: updateData.partnerId } })
        if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
        if (!partner.isActive) return NextResponse.json({ error: 'Partner is inactive' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        partner: { select: { id: true, name: true } },
        updatedAt: true
      }
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { id } = params

    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (existingUser.role === 'ADMIN') return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 })

    await prisma.user.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
