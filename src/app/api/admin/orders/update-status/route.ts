import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'SERVED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: validatedData.orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Update order status and set appropriate timestamp
    const updateData: any = {
      status: validatedData.status
    }

    // Set timestamp based on status
    switch (validatedData.status) {
      case 'CONFIRMED':
        updateData.confirmedAt = new Date()
        break
      case 'PREPARING':
        updateData.preparingAt = new Date()
        break
      case 'READY':
        updateData.readyAt = new Date()
        break
      case 'SERVED':
      case 'COMPLETED':
        updateData.deliveredAt = new Date()
        break
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: validatedData.orderId },
      data: updateData
    })

    // Create order tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: validatedData.orderId,
        status: validatedData.status,
        message: validatedData.notes
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      }
    })

  } catch (error) {
    console.error('Error updating order status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update order status'
    }, { status: 500 })
  }
}
