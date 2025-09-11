import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const phone = searchParams.get('phone')

    if (!orderNumber || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Order number and phone number are required'
      }, { status: 400 })
    }

    // Find order by order number and phone
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        guestPhone: phone
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
        deliveryAddress: true,
        orderTracking: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found. Please check your order number and phone number.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: {
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
          notes: tracking.notes,
          createdAt: tracking.createdAt.toISOString()
        }))
      }
    })

  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track order'
    }, { status: 500 })
  }
}
