import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = headersList.get('x-customer-session')
    
    // For now, we'll check customer session from cookies or headers
    // In a real app, you'd validate JWT tokens or session cookies
    const customerId = request.headers.get('x-customer-id')
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: customerId
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        orderTracking: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      take: 20
    })

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        totalAmount: order.totalAmount,
        estimatedTime: order.estimatedTime,
        tableNumber: order.tableNumber,
        notes: order.notes,
        isPreOrder: order.isPreOrder,
        scheduledDate: order.scheduledDate?.toISOString(),
        scheduledTime: order.scheduledTime,
        orderDate: order.orderDate.toISOString(),
        confirmedAt: order.confirmedAt?.toISOString(),
        preparingAt: order.preparingAt?.toISOString(),
        readyAt: order.readyAt?.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString(),
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          menuItem: item.menuItem
        })),
        orderTracking: order.orderTracking.map(tracking => ({
          id: tracking.id,
          status: tracking.status,
          message: tracking.message,
          timestamp: tracking.timestamp.toISOString(),
          estimatedTime: tracking.estimatedTime,
          updatedBy: tracking.updatedBy
        }))
      }))
    })

  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}