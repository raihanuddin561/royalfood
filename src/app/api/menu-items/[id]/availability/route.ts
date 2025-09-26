import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isAvailable } = body

    console.log('🔄 [AVAILABILITY_UPDATE] Updating availability for menu item:', { id, isAvailable })

    // Validate input
    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'isAvailable must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
      select: { id: true, name: true, isAvailable: true }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Update availability
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      select: {
        id: true,
        name: true,
        isAvailable: true
      }
    })

    console.log('✅ [AVAILABILITY_UPDATE] Successfully updated availability:', {
      itemId: id,
      itemName: updatedMenuItem.name,
      oldAvailability: existingMenuItem.isAvailable,
      newAvailability: updatedMenuItem.isAvailable
    })

    return NextResponse.json({
      success: true,
      data: updatedMenuItem,
      message: `${updatedMenuItem.name} is now ${isAvailable ? 'available' : 'unavailable'}`
    })

  } catch (error) {
    console.error('❌ [AVAILABILITY_UPDATE] Error updating availability:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}