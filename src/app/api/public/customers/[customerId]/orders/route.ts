import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/customers/[customerId]/orders - Get customer order history
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customerId = params.customerId
    
    // Get customer orders with details
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
        deliveryAddress: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Calculate order statistics
    const totalOrders = orders.length
    const totalSpent = orders
      .filter(order => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.totalAmount, 0)
    
    const favoriteItems = orders
      .filter(order => order.status !== 'CANCELLED')
      .flatMap(order => order.orderItems)
      .reduce((acc, item) => {
        if (item.menuItem) {
          const key = item.menuItem.name
          acc[key] = (acc[key] || 0) + item.quantity
        }
        return acc
      }, {} as Record<string, number>)
    
    const topFavorites = Object.entries(favoriteItems)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
    
    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        items: order.orderItems.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        deliveryAddress: order.deliveryAddress
      })),
      statistics: {
        totalOrders,
        totalSpent,
        topFavorites
      }
    })
    
  } catch (error) {
    console.error('Customer orders fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer orders'
    }, { status: 500 })
  }
}
