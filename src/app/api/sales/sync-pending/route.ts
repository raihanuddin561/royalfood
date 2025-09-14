import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find orders that are SERVED or COMPLETED but don't have sales records
    const servedOrdersWithoutSales = await prisma.order.findMany({
      where: {
        status: {
          in: ['SERVED', 'COMPLETED']
        },
        // Check if there's no corresponding sale record
        NOT: {
          Sale: {
            some: {}
          }
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                costPerUnit: true,
                category: true
              }
            },
            item: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                costPerUnit: true,
                category: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    let recordsCreated = 0

    for (const order of servedOrdersWithoutSales) {
      // Get a system user if no user is assigned to the order
      let assignedUserId = session.user.id // Use current user as fallback
      
      // Calculate totals from order items
      let subtotal = 0
      for (const item of order.orderItems) {
        const price = item.menuItem?.price || item.item?.sellingPrice || 0
        subtotal += price * item.quantity
      }

      const taxAmount = subtotal * 0.1 // 10% tax
      const deliveryFee = order.orderType === 'DELIVERY' ? 5 : 0
      const discountAmount = order.discountAmount || 0
      const totalAmount = subtotal + taxAmount + deliveryFee - discountAmount

      // Create sale record
      const saleNumber = `SAL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      
      const sale = await prisma.sale.create({
        data: {
          saleNumber,
          saleDate: order.deliveredAt || order.updatedAt || new Date(),
          totalAmount,
          paymentMethod: order.paymentMethod || 'CASH',
          status: 'COMPLETED',
          userId: assignedUserId,
          orderId: order.id,
          customerId: order.customerId,
          subtotal,
          taxAmount,
          deliveryFee,
          discountAmount,
          finalAmount: totalAmount
        }
      })

      // Create menu item sales records
      for (const item of order.orderItems) {
        const menuItem = item.menuItem || item.item
        if (!menuItem) continue

        const price = menuItem.price || menuItem.sellingPrice || 0
        const cost = menuItem.costPerUnit || 0
        const totalPrice = price * item.quantity
        const totalCost = cost * item.quantity
        const grossProfit = totalPrice - totalCost

        await prisma.menuItemSale.create({
          data: {
            saleId: sale.id,
            menuItemId: menuItem.id,
            quantity: item.quantity,
            unitPrice: price,
            totalPrice,
            unitCost: cost,
            totalCost,
            grossProfit,
            profitMargin: totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0,
            saleDate: new Date()
          }
        })
      }

      recordsCreated++
    }

    return NextResponse.json({
      success: true,
      recordsCreated,
      message: `Successfully created ${recordsCreated} sales records`
    })

  } catch (error) {
    console.error('Sync pending sales error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync sales records',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}