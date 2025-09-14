import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Auto-complete orders that have been delivered but not marked as completed
async function autoCompleteDeliveredOrders() {
  try {
    // Find orders that are marked as delivered but not yet completed/served
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['OUT_FOR_DELIVERY', 'READY']
        },
        deliveredAt: {
          not: null
        },
        // Orders delivered more than 1 hour ago should be auto-completed
        deliveredAt: {
          lte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
            item: true
          }
        }
      }
    })

    let completedCount = 0

    for (const order of deliveredOrders) {
      try {
        // Update order status to SERVED (which will trigger sales record creation)
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'SERVED'
          }
        })

        // Create order tracking entry
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: 'SERVED',
            message: 'Auto-completed after delivery'
          }
        })

        completedCount++
        console.log(`Auto-completed order ${order.orderNumber}`)
      } catch (error) {
        console.error(`Failed to auto-complete order ${order.orderNumber}:`, error)
      }
    }

    return completedCount
  } catch (error) {
    console.error('Error in auto-complete process:', error)
    return 0
  }
}

// Auto-complete customer orders that should be considered as completed
async function autoCompleteCustomerOrders() {
  try {
    // Find customer orders that are in final status but not marked as SERVED/COMPLETED
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['SERVED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
        },
        // Orders placed more than 2 hours ago for DINE_IN and TAKEAWAY
        // Orders placed more than 4 hours ago for DELIVERY
        OR: [
          {
            orderType: {
              in: ['DINE_IN', 'TAKEAWAY']
            },
            orderDate: {
              lte: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          },
          {
            orderType: 'DELIVERY',
            orderDate: {
              lte: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            }
          }
        ]
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
            item: true
          }
        }
      }
    })

    let completedCount = 0

    for (const order of pendingOrders) {
      try {
        // Update order status to SERVED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'SERVED',
            deliveredAt: order.deliveredAt || new Date()
          }
        })

        // Create order tracking entry
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: 'SERVED',
            message: 'Auto-completed based on time elapsed'
          }
        })

        completedCount++
        console.log(`Auto-completed customer order ${order.orderNumber}`)
      } catch (error) {
        console.error(`Failed to auto-complete order ${order.orderNumber}:`, error)
      }
    }

    return completedCount
  } catch (error) {
    console.error('Error in customer order auto-complete:', error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    // Run both auto-completion processes
    const [deliveredCount, customerCount] = await Promise.all([
      autoCompleteDeliveredOrders(),
      autoCompleteCustomerOrders()
    ])

    const totalCompleted = deliveredCount + customerCount

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${totalCompleted} orders`,
      details: {
        deliveredOrders: deliveredCount,
        customerOrders: customerCount,
        total: totalCompleted
      }
    })

  } catch (error) {
    console.error('Auto-complete orders error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to auto-complete orders'
    }, { status: 500 })
  }
}

// Also allow GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request)
}

export const dynamic = 'force-dynamic'