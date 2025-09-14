import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Automatically process customer orders to create sales records
export async function POST(request: NextRequest) {
  try {
    console.log('Starting automatic order completion process...')

    // Step 1: Find orders that should be marked as completed
    const ordersToComplete = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['SERVED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
        },
        // Auto-complete orders based on type and time elapsed
        OR: [
          // DINE_IN and TAKEAWAY orders older than 2 hours
          {
            orderType: {
              in: ['DINE_IN', 'TAKEAWAY']
            },
            orderDate: {
              lte: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
          },
          // DELIVERY orders older than 4 hours
          {
            orderType: 'DELIVERY',
            orderDate: {
              lte: new Date(Date.now() - 4 * 60 * 60 * 1000)
            }
          },
          // Orders with deliveredAt timestamp older than 30 minutes
          {
            deliveredAt: {
              not: null,
              lte: new Date(Date.now() - 30 * 60 * 1000)
            }
          }
        ]
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                costPerUnit: true
              }
            },
            item: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                costPerUnit: true
              }
            }
          }
        },
        customer: true
      }
    })

    console.log(`Found ${ordersToComplete.length} orders to complete`)

    // Step 2: Get or create a system user for sales records
    let systemUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'system@royalfood.com' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@royalfood.com',
          name: 'System User',
          role: 'ADMIN',
          isActive: true,
          password: 'system-auto-process'
        }
      })
      console.log('Created system user for order processing')
    }

    let processedCount = 0
    let salesCreatedCount = 0

    // Step 3: Process each order
    for (const order of ordersToComplete) {
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
            message: 'Auto-completed by system based on time elapsed'
          }
        })

        processedCount++

        // Check if sales record already exists
        const existingSale = await prisma.sale.findUnique({
          where: { orderId: order.id }
        })

        if (!existingSale) {
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
          const saleNumber = `AUTO-${dateStr}-${String(salesCount + 1).padStart(4, '0')}`

          // Create sales record
          const sale = await prisma.sale.create({
            data: {
              orderId: order.id,
              saleNumber,
              userId: systemUser.id,
              customerId: order.customerId,
              saleDate: order.deliveredAt || new Date(),
              subtotal: order.subtotal || 0,
              taxAmount: order.taxAmount || 0,
              discountAmount: order.discountAmount || 0,
              deliveryFee: order.deliveryFee || 0,
              totalAmount: order.totalAmount || 0,
              finalAmount: order.totalAmount || 0,
              paymentMethod: order.paymentMethod || 'CASH',
              status: 'COMPLETED',
              notes: `Auto-created from completed customer order ${order.orderNumber}`
            }
          })

          // Create detailed menu item sales for analytics
          for (const orderItem of order.orderItems) {
            const menuItem = orderItem.menuItem || orderItem.item
            if (!menuItem) continue

            const unitPrice = menuItem.price || menuItem.sellingPrice || 0
            const unitCost = menuItem.costPerUnit || 0
            const totalPrice = unitPrice * orderItem.quantity
            const totalCost = unitCost * orderItem.quantity
            const grossProfit = totalPrice - totalCost
            const profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0

            await prisma.menuItemSale.create({
              data: {
                saleId: sale.id,
                menuItemId: menuItem.id,
                quantity: orderItem.quantity,
                unitPrice,
                totalPrice,
                unitCost,
                totalCost,
                grossProfit,
                profitMargin,
                saleDate: sale.saleDate
              }
            })
          }

          salesCreatedCount++
          console.log(`Created sales record ${saleNumber} for order ${order.orderNumber}`)
        }

      } catch (error) {
        console.error(`Failed to process order ${order.orderNumber}:`, error)
      }
    }

    // Step 4: Sync any remaining orders that were manually marked as SERVED but don't have sales records
    const servedOrdersWithoutSales = await prisma.order.findMany({
      where: {
        status: {
          in: ['SERVED', 'COMPLETED']
        },
        sale: null
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

    console.log(`Found ${servedOrdersWithoutSales.length} served orders without sales records`)

    for (const order of servedOrdersWithoutSales) {
      try {
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
        const saleNumber = `SYNC-${dateStr}-${String(salesCount + 1).padStart(4, '0')}`

        // Create sales record
        const sale = await prisma.sale.create({
          data: {
            orderId: order.id,
            saleNumber,
            userId: systemUser.id,
            customerId: order.customerId,
            saleDate: order.deliveredAt || order.updatedAt || new Date(),
            subtotal: order.subtotal || 0,
            taxAmount: order.taxAmount || 0,
            discountAmount: order.discountAmount || 0,
            deliveryFee: order.deliveryFee || 0,
            totalAmount: order.totalAmount || 0,
            finalAmount: order.totalAmount || 0,
            paymentMethod: order.paymentMethod || 'CASH',
            status: 'COMPLETED',
            notes: `Synced from served order ${order.orderNumber}`
          }
        })

        // Create detailed menu item sales
        for (const orderItem of order.orderItems) {
          const menuItem = orderItem.menuItem || orderItem.item
          if (!menuItem) continue

          const unitPrice = menuItem.price || menuItem.sellingPrice || 0
          const unitCost = menuItem.costPerUnit || 0
          const totalPrice = unitPrice * orderItem.quantity
          const totalCost = unitCost * orderItem.quantity
          const grossProfit = totalPrice - totalCost
          const profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0

          await prisma.menuItemSale.create({
            data: {
              saleId: sale.id,
              menuItemId: menuItem.id,
              quantity: orderItem.quantity,
              unitPrice,
              totalPrice,
              unitCost,
              totalCost,
              grossProfit,
              profitMargin,
              saleDate: sale.saleDate
            }
          })
        }

        salesCreatedCount++
        console.log(`Synced sales record ${saleNumber} for served order ${order.orderNumber}`)

      } catch (error) {
        console.error(`Failed to sync order ${order.orderNumber}:`, error)
      }
    }

    const totalResults = {
      ordersProcessed: processedCount,
      salesRecordsCreated: salesCreatedCount,
      totalOrdersFound: ordersToComplete.length,
      servedOrdersSynced: servedOrdersWithoutSales.length
    }

    console.log('Auto-completion process completed:', totalResults)

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} orders and created ${salesCreatedCount} sales records`,
      details: totalResults
    })

  } catch (error) {
    console.error('Auto-completion process error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request)
}

export const dynamic = 'force-dynamic'