import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import crypto from 'crypto'

interface JWTPayload {
  customerId: string
  [key: string]: any
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const phone = searchParams.get('phone')
    const orderId = searchParams.get('orderId')
    const guestToken = searchParams.get('token')

    // Support both old tracking method (orderNumber + phone) and new success page method (orderId + token)
    let whereClause: any

    if (orderId) {
      // New method for success page
      whereClause = { id: orderId }
    } else if (orderNumber && phone) {
      // Old method for order tracking
      whereClause = {
        orderNumber: orderNumber,
        guestPhone: phone
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either orderId or (orderNumber and phone) are required'
      }, { status: 400 })
    }

    // Try to get customer from session for authenticated users
    let customerId: string | null = null
    
    try {
      const cookieStore = await cookies()
      const authToken = cookieStore.get('auth-token')?.value

      if (authToken) {
        const decoded = verify(authToken, process.env.JWT_SECRET!) as JWTPayload
        customerId = decoded.customerId
      }
    } catch (error) {
      // Not authenticated, continue with guest access
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: whereClause,
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
            timestamp: 'desc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Check access permissions for orderId requests
    if (orderId) {
      let hasAccess = false

      // Registered user access
      if (customerId && order.customerId === customerId) {
        hasAccess = true
      }

      // Guest access with token
      if (!hasAccess && guestToken && !order.customerId) {
        // Generate expected token for this order
        const expectedToken = crypto
          .createHash('sha256')
          .update(`${order.id}-${order.guestPhone || order.guestEmail || order.guestName}-${process.env.GUEST_TOKEN_SECRET || 'default-secret'}`)
          .digest('hex')
          .substring(0, 16)

        if (guestToken === expectedToken) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied'
        }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        subtotal: order.subtotal || 0,
        taxAmount: order.taxAmount || 0,
        deliveryFee: order.deliveryFee || 0,
        totalAmount: order.totalAmount,
        estimatedTime: order.estimatedTime,
        isPreOrder: order.isPreOrder,
        scheduledDate: order.scheduledDate?.toISOString(),
        scheduledTime: order.scheduledTime,
        notes: order.notes,
        
        // Customer info
        customerId: order.customerId,
        guestName: order.guestName,
        guestPhone: order.guestPhone,
        guestEmail: order.guestEmail,
        guestAddress: order.guestAddress,
        tableNumber: order.tableNumber,
        
        // Order items
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
          menuItem: {
            name: item.menuItem.name,
            image: item.menuItem.image
          }
        })),
        
        // Timestamps
        createdAt: order.orderDate.toISOString(),
        updatedAt: order.updatedAt?.toISOString(),
        orderDate: order.orderDate.toISOString(),
        confirmedAt: order.confirmedAt?.toISOString(),
        preparingAt: order.preparingAt?.toISOString(),
        readyAt: order.readyAt?.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString(),
        
        // Order tracking (for old tracking functionality)
        orderTracking: order.orderTracking.map((tracking: any) => ({
          id: tracking.id,
          status: tracking.status,
          message: tracking.message,
          timestamp: tracking.timestamp.toISOString()
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
