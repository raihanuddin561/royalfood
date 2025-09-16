import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to create sales record from completed order
async function createSalesRecord(order: any) {
  try {
    // Check if sales record already exists for this order
    const existingSale = await prisma.sale.findUnique({
      where: { orderId: order.id }
    })

    if (existingSale) {
      console.log(`Sales record already exists for order ${order.orderNumber}`)
      return existingSale
    }

    // Get a system user if no user is assigned to the order
    let assignedUserId = order.userId
    if (!assignedUserId) {
      // Try to find an admin user as fallback
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      if (systemUser) {
        assignedUserId = systemUser.id
      } else {
        // Create a system user if none exists
        const newSystemUser = await prisma.user.create({
          data: {
            email: 'system@royalfood.com',
            name: 'System User',
            role: 'ADMIN',
            isActive: true,
            password: 'system-user-no-login' // This won't be used for login
          }
        })
        assignedUserId = newSystemUser.id
      }
    }

    // Generate unique sale number
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const salesCount = await prisma.sale.count({
      where: {
        saleDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      }
    })
    const saleNumber = `SALE-${dateStr}-${String(salesCount + 1).padStart(4, '0')}`

    // Create the sales record
    const salesRecord = await prisma.sale.create({
      data: {
        orderId: order.id,
        saleNumber,
        userId: assignedUserId,
        customerId: order.customerId,
        saleDate: new Date(),
        subtotal: order.subtotal || 0,
        taxAmount: order.taxAmount || 0,
        discountAmount: order.discountAmount || 0,
        deliveryFee: order.deliveryFee || 0,
        totalAmount: order.totalAmount || 0,
        finalAmount: order.totalAmount || 0,
        paymentMethod: order.paymentMethod || 'CASH',
        status: 'COMPLETED',
        notes: `Auto-created from order ${order.orderNumber}`
      }
    })

    // Create detailed menu item sales records for analytics
    if (order.orderItems && order.orderItems.length > 0) {
      for (const orderItem of order.orderItems) {
        await prisma.menuItemSale.create({
          data: {
            menuItemId: orderItem.menuItemId,
            saleId: salesRecord.id,
            quantity: Math.floor(orderItem.quantity), // Ensure integer for quantity
            unitPrice: orderItem.unitPrice,
            totalPrice: orderItem.totalPrice,
            unitCost: orderItem.menuItem?.costPrice || 0,
            totalCost: (orderItem.menuItem?.costPrice || 0) * orderItem.quantity,
            grossProfit: orderItem.totalPrice - ((orderItem.menuItem?.costPrice || 0) * orderItem.quantity),
            profitMargin: orderItem.totalPrice > 0 ? 
              ((orderItem.totalPrice - ((orderItem.menuItem?.costPrice || 0) * orderItem.quantity)) / orderItem.totalPrice) * 100 : 0,
            saleDate: new Date()
          }
        })
      }
    }

    console.log(`Created sales record ${saleNumber} for order ${order.orderNumber}`)
    return salesRecord

  } catch (error) {
    console.error('Error creating sales record:', error)
    // Don't throw error to avoid breaking order status update
    return null
  }
}

const updateStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'SERVED', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
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
      case 'REFUNDED':
        updateData.deliveredAt = new Date()
        break
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: validatedData.orderId },
      data: updateData,
      include: {
        orderItems: {
          include: {
            menuItem: true,
            item: true
          }
        }
      }
    })

    // Create order tracking entry (with error handling for missing columns)
    try {
      await prisma.orderTracking.create({
        data: {
          orderId: validatedData.orderId,
          status: validatedData.status,
          message: validatedData.notes || null,
          timestamp: new Date(),
          updatedBy: session?.user?.id || null
        }
      })
    } catch (trackingError) {
      console.warn('Could not create order tracking entry:', trackingError)
      // Continue without order tracking if table has schema issues
    }

    // Create sales record when order is served or completed
    if (validatedData.status === 'SERVED' || validatedData.status === 'COMPLETED') {
      await createSalesRecord(updatedOrder)
    }

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
