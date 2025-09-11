import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    if (!email || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Email and phone number are required'
      }, { status: 400 })
    }

    // Find customer first
    const customer = await prisma.customer.findFirst({
      where: {
        email: email,
        phone: phone
      }
    })

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found with provided email and phone'
      }, { status: 404 })
    }

    // Find orders for this customer (both registered and guest orders)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { guestEmail: email, guestPhone: phone }
        ]
      },
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
        }
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
        orderDate: order.orderDate.toISOString(),
        isPreOrder: order.isPreOrder,
        scheduledDate: order.scheduledDate?.toISOString(),
        scheduledTime: order.scheduledTime,
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          menuItem: item.menuItem
        }))
      }))
    })

  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}
