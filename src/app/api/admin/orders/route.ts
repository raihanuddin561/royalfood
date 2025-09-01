import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/orders - Get all orders for admin management
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin/manager
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (orderType && orderType !== 'all') {
      where.orderType = orderType
    }

    // Get orders with customer info and items
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          deliveryAddress: true,
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
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      
      prisma.order.count({ where })
    ])

    // Get today's statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStats = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({
        where: {
          status: 'PENDING'
        }
      }),
      prisma.order.count({
        where: {
          status: 'PREPARING'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      statistics: {
        todayOrders: todayStats[0],
        todayRevenue: todayStats[1]._sum.totalAmount || 0,
        pendingOrders: todayStats[2],
        preparingOrders: todayStats[3]
      }
    })

  } catch (error) {
    console.error('Admin orders fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}

// PATCH /api/admin/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, status, notes } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and status are required'
      }, { status: 400 })
    }

    // Update order with timestamp tracking
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (notes) {
      updateData.kitchenNotes = notes
    }

    // Add timestamp for status changes
    const now = new Date()
    switch (status) {
      case 'CONFIRMED':
        updateData.confirmedAt = now
        break
      case 'PREPARING':
        updateData.preparingAt = now
        break
      case 'READY':
        updateData.readyAt = now
        break
      case 'DELIVERED':
      case 'COMPLETED':
        updateData.deliveredAt = now
        break
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // If order is completed, create a sale record
    if (status === 'COMPLETED' && !updatedOrder.sale) {
      const saleNumber = `SALE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`
      
      await prisma.sale.create({
        data: {
          orderId: updatedOrder.id,
          saleNumber,
          userId: session.user.id,
          customerId: updatedOrder.customerId,
          saleDate: now,
          subtotal: updatedOrder.subtotal,
          taxAmount: updatedOrder.taxAmount,
          discountAmount: updatedOrder.discountAmount,
          deliveryFee: updatedOrder.deliveryFee,
          totalAmount: updatedOrder.totalAmount,
          paymentMethod: updatedOrder.paymentMethod,
          status: 'COMPLETED'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Order status update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update order status'
    }, { status: 500 })
  }
}
