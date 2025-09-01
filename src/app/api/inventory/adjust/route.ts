import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { itemId, quantity, type, reason } = body

    // Validate input
    if (!itemId || quantity === undefined || quantity === null || !type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: itemId, quantity, type' },
        { status: 400 }
      )
    }

    const quantityNum = typeof quantity === 'number' ? quantity : parseFloat(quantity)
    if (isNaN(quantityNum)) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be a valid number' },
        { status: 400 }
      )
    }

    if (!['ADJUSTMENT', 'WASTE'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Type must be ADJUSTMENT or WASTE' },
        { status: 400 }
      )
    }

    // Get the item to check current stock
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }

    // For adjustments, quantity can be positive (increase) or negative (decrease)
    // The form should send the actual quantity change needed
    const actualQuantityChange = quantityNum

    // Check if this would make stock negative
    const newStock = item.currentStock + actualQuantityChange
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, message: `Insufficient stock. Available: ${item.currentStock} ${item.unit}. Cannot remove ${Math.abs(actualQuantityChange)} ${item.unit}` },
        { status: 400 }
      )
    }

    // Create the adjustment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the item stock
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: { currentStock: newStock }
      })

      // Create inventory log entry
      const inventoryLog = await tx.inventoryLog.create({
        data: {
          itemId: itemId,
          userId: session.user.id,
          type: type,
          quantity: actualQuantityChange,
          previousStock: item.currentStock,
          newStock: newStock,
          reason: reason || `${type === 'WASTE' ? 'Waste recorded' : 'Stock adjustment'}: ${Math.abs(actualQuantityChange)} ${item.unit}`,
          reference: null
        }
      })

      return { updatedItem, inventoryLog }
    })

    return NextResponse.json({
      success: true,
      message: `${type === 'WASTE' ? 'Waste recorded' : 'Stock adjusted'} successfully`,
      data: {
        itemId: itemId,
        itemName: item.name,
        previousStock: item.currentStock,
        newStock: newStock,
        adjustment: actualQuantityChange,
        type: type
      }
    })

  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to record adjustment' },
      { status: 500 }
    )
  }
}
