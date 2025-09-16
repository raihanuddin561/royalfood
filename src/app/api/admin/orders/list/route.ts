import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        orderDate: 'desc'
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
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        deliveryAddress: {
          select: {
            address: true,
            city: true,
            zipCode: true,
            landmark: true
          }
        }
        // Remove orderTracking include to avoid missing column errors
        // orderTracking: {
        //   orderBy: {
        //     timestamp: 'desc'
        //   },
        //   take: 5
        // }
      }
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
        guestName: order.guestName,
        guestPhone: order.guestPhone,
        guestEmail: order.guestEmail,
        guestAddress: order.guestAddress,
        tableNumber: order.tableNumber,
        notes: order.notes,
        kitchenNotes: order.kitchenNotes,
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
        customer: order.customer,
        deliveryAddress: order.deliveryAddress
        // Remove orderTracking to avoid missing column errors
        // orderTracking: order.orderTracking.map((tracking: any) => ({
        //   id: tracking.id,
        //   status: tracking.status,
        //   message: tracking.message || null,
        //   timestamp: tracking.timestamp.toISOString()
        // }))
      }))
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}
