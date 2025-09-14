import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Safely extract and validate parameters
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const paymentMethodParam = searchParams.get('paymentMethod') || undefined
    const limitParam = searchParams.get('limit') || '50'
    const offsetParam = searchParams.get('offset') || '0'
    
    // Validate payment method if provided
    const validPaymentMethods = ['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER']
    const paymentMethod = paymentMethodParam && validPaymentMethods.includes(paymentMethodParam) 
      ? paymentMethodParam : undefined
    
    const limit = parseInt(limitParam)
    const offset = parseInt(offsetParam)

    // Build where clause for filtering
    const whereClause: any = {}

    // Date filtering
    if (startDate || endDate) {
      whereClause.saleDate = {}
      if (startDate) {
        whereClause.saleDate.gte = new Date(startDate)
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setHours(23, 59, 59, 999) // Include the entire end date
        whereClause.saleDate.lte = endDateObj
      }
    }

    // Customer filtering
    if (customerId) {
      whereClause.customerId = customerId
    }

    // Payment method filtering
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod
    }

    // Get sales data with relations
    const [sales, totalCount, todayStats, salesSummary] = await Promise.all([
      // Main sales query
      prisma.sale.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true
            }
          },
          customer: {
            select: {
              name: true,
              phone: true
            }
          },
          order: {
            select: {
              orderNumber: true,
              orderType: true,
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
          },
          menuItemSales: {
            include: {
              menuItem: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          saleDate: 'desc'
        },
        take: limit,
        skip: offset
      }),

      // Total count for pagination
      prisma.sale.count({
        where: whereClause
      }),

      // Today's statistics
      getTodayStats(),

      // Sales summary for the filtered period
      getSalesSummary(whereClause)
    ])

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: (offset + limit) < totalCount
        },
        todayStats,
        summary: salesSummary
      }
    })

  } catch (error) {
    console.error('Error fetching sales data:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sales data'
    }, { status: 500 })
  }
}

async function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todaySales, todayCount, todayOrders] = await Promise.all([
    // Today's sales total
    prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: true
    }),

    // Today's orders count
    prisma.order.count({
      where: {
        orderDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['SERVED', 'COMPLETED']
        }
      }
    }),

    // Orders that need sales records (served but no sale)
    prisma.order.count({
      where: {
        status: {
          in: ['SERVED', 'COMPLETED']
        },
        sale: null // Orders without sales records
      }
    })
  ])

  return {
    todayRevenue: todaySales._sum.totalAmount || 0,
    todayTransactions: todaySales._count,
    servedOrders: todayCount,
    pendingSalesRecords: todayOrders
  }
}

async function getSalesSummary(whereClause: any) {
  const summary = await prisma.sale.aggregate({
    where: whereClause,
    _sum: {
      subtotal: true,
      taxAmount: true,
      deliveryFee: true,
      totalAmount: true
    },
    _count: true,
    _avg: {
      totalAmount: true
    }
  })

  // Payment method breakdown
  const paymentBreakdown = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: whereClause,
    _sum: {
      totalAmount: true
    },
    _count: true
  })

  return {
    totalRevenue: summary._sum.totalAmount || 0,
    totalTransactions: summary._count,
    averageOrderValue: summary._avg.totalAmount || 0,
    totalTax: summary._sum.taxAmount || 0,
    totalDeliveryFees: summary._sum.deliveryFee || 0,
    paymentBreakdown
  }
}

export const dynamic = 'force-dynamic'