'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { OrderStatus, OrderType } from '@prisma/client'

export interface OrderFormData {
  id?: string
  orderNumber?: string
  customerId?: string | null
  userId: string
  orderType: OrderType
  status?: OrderStatus
  tableNumber?: string | null
  customerName?: string | null
  customerPhone?: string | null
  totalAmount: number
  taxAmount?: number
  discountAmount?: number
  finalAmount: number
  notes?: string | null
  orderItems: {
    id?: string
    menuItemId?: string
    itemId?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes?: string | null
  }[]
}

export async function createOrder(data: OrderFormData) {
  try {
    const orderNumber = data.orderNumber || `ORD-${Date.now()}`
    
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          userId: data.userId,
          orderType: data.orderType,
          status: data.status || 'PENDING',
          tableNumber: data.tableNumber,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          totalAmount: data.totalAmount,
          taxAmount: data.taxAmount || 0,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount,
          notes: data.notes
        }
      })

      // Create order items
      if (data.orderItems && data.orderItems.length > 0) {
        await tx.orderItem.createMany({
          data: data.orderItems.map(item => ({
            orderId: newOrder.id,
            menuItemId: item.menuItemId || null,
            itemId: item.itemId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }))
        })
      }

      return newOrder
    })

    revalidatePath('/orders')
    revalidatePath('/dashboard')
    
    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Failed to create order' }
  }
}

export async function updateOrder(orderId: string, data: OrderFormData) {
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          customerId: data.customerId,
          orderType: data.orderType,
          status: data.status,
          tableNumber: data.tableNumber,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          totalAmount: data.totalAmount,
          taxAmount: data.taxAmount || 0,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount,
          notes: data.notes
        }
      })

      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId }
      })

      // Create new order items
      if (data.orderItems && data.orderItems.length > 0) {
        await tx.orderItem.createMany({
          data: data.orderItems.map(item => ({
            orderId: updatedOrder.id,
            menuItemId: item.menuItemId || null,
            itemId: item.itemId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }))
        })
      }

      return updatedOrder
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard')
    
    return { success: true, order }
  } catch (error) {
    console.error('Error updating order:', error)
    return { success: false, error: 'Failed to update order' }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    // Check if order exists and get its details
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        sale: true,
        stockUsage: true
      }
    })

    if (!existingOrder) {
      return { success: false, error: 'Order not found' }
    }

    // Check if order has dependencies that prevent deletion
    if (existingOrder.sale) {
      return { 
        success: false, 
        error: 'Cannot delete order with associated sale. Please remove the sale first.' 
      }
    }

    if (existingOrder.stockUsage && existingOrder.stockUsage.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete order with stock usage records. Please remove stock usage first.' 
      }
    }

    // Check if order is in a state that allows deletion
    if (existingOrder.status === 'COMPLETED') {
      return { 
        success: false, 
        error: 'Cannot delete completed order. Consider cancelling instead.' 
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete order items first
      await tx.orderItem.deleteMany({
        where: { orderId }
      })

      // Delete the order
      await tx.order.delete({
        where: { id: orderId }
      })
    })

    revalidatePath('/orders')
    revalidatePath('/dashboard')
    
    return { success: true, message: 'Order deleted successfully' }
  } catch (error) {
    console.error('Error deleting order:', error)
    return { 
      success: false, 
      error: `Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard')
    
    return { success: true, order }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

export async function cancelOrder(orderId: string, reason?: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
      }
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard')
    
    return { success: true, order }
  } catch (error) {
    console.error('Error cancelling order:', error)
    return { success: false, error: 'Failed to cancel order' }
  }
}

export async function getOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            },
            item: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        sale: true
      }
    })

    return { success: true, order }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { success: false, error: 'Failed to fetch order' }
  }
}

export async function getOrdersWithStats() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [orders, todayStats, statusCounts] = await Promise.all([
      // Get all orders with related data
      prisma.order.findMany({
        include: {
          user: {
            select: {
              name: true
            }
          },
          orderItems: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  price: true
                }
              },
              item: {
                select: {
                  name: true,
                  sellingPrice: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Get today's statistics
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _count: {
          id: true
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Get status counts
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
    ])

    return { 
      success: true,
      orders, 
      todayOrdersCount: todayStats._count.id || 0,
      todayRevenue: todayStats._sum.finalAmount || 0,
      statusCounts: statusCounts.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    }
  } catch (error) {
    console.error('Orders data fetch error:', error)
    return { 
      success: false,
      error: 'Failed to fetch orders data',
      orders: [], 
      todayOrdersCount: 0, 
      todayRevenue: 0,
      statusCounts: {}
    }
  }
}
