import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for order submission
const orderItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().min(1),
  notes: z.string().optional()
})

const submitOrderSchema = z.object({
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  
  // Customer information
  customerId: z.string().optional(), // For registered customers
  
  // Guest customer information (required if no customerId)
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  guestEmail: z.string().optional(),
  guestAddress: z.string().optional(),
  
  // Pre-order functionality
  isPreOrder: z.boolean().default(false),
  scheduledDate: z.string().optional(), // ISO date string
  scheduledTime: z.string().optional(), // "breakfast", "lunch", "dinner", or "HH:MM"
  
  // Order details
  tableNumber: z.string().optional(),
  deliveryAddressId: z.string().optional(),
  notes: z.string().optional(),
  kitchenNotes: z.string().optional()
})

// POST /api/public/orders/submit - Submit customer order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = submitOrderSchema.parse(body)
    
    // Validate customer information
    if (!validatedData.customerId && (!validatedData.guestName || !validatedData.guestPhone)) {
      return NextResponse.json({
        success: false,
        error: 'Customer name and phone are required'
      }, { status: 400 })
    }
    
    if (validatedData.orderType === 'DELIVERY' && 
        !validatedData.deliveryAddressId && 
        !validatedData.guestAddress) {
      return NextResponse.json({
        success: false,
        error: 'Delivery address is required for delivery orders'
      }, { status: 400 })
    }
    
    // Validate pre-order data
    if (validatedData.isPreOrder) {
      if (!validatedData.scheduledDate) {
        return NextResponse.json({
          success: false,
          error: 'Scheduled date is required for pre-orders'
        }, { status: 400 })
      }
      
      const scheduledDate = new Date(validatedData.scheduledDate)
      if (scheduledDate <= new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Scheduled date must be in the future'
        }, { status: 400 })
      }
    }
    
    // Get menu items to calculate pricing
    const menuItemIds = validatedData.items.map(item => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isActive: true,
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        prepTime: true
      }
    })
    
    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Some menu items are not available'
      }, { status: 400 })
    }
    
    // Calculate order totals
    let subtotal = 0
    const orderItems = validatedData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      const itemTotal = menuItem.price * item.quantity
      subtotal += itemTotal
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        notes: item.notes || null
      }
    })
    
    // Calculate fees and taxes
    const taxRate = 0.05 // 5% tax (configurable)
    const taxAmount = subtotal * taxRate
    const deliveryFee = validatedData.orderType === 'DELIVERY' ? 50 : 0 // BDT 50 delivery fee
    const totalAmount = subtotal + taxAmount + deliveryFee
    
    // Generate order number
    const today = new Date()
    const orderNumber = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`
    
    // Estimate preparation time
    const totalPrepTime = validatedData.items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      return total + (menuItem.prepTime || 15) * item.quantity
    }, 0)
    
    // Create order (we'll use a system user for now, or create a special "CUSTOMER_ORDERS" user)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!systemUser) {
      return NextResponse.json({
        success: false,
        error: 'System configuration error'
      }, { status: 500 })
    }
    
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: validatedData.customerId || null,
        deliveryAddressId: validatedData.deliveryAddressId || null,
        userId: systemUser.id,
        
        // Guest customer data
        guestName: validatedData.guestName || null,
        guestPhone: validatedData.guestPhone || null,
        guestEmail: validatedData.guestEmail || null,
        guestAddress: validatedData.guestAddress || null,
        
        orderType: validatedData.orderType,
        status: 'PENDING',
        tableNumber: validatedData.tableNumber || null,
        
        // Pre-order fields
        isPreOrder: validatedData.isPreOrder || false,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
        scheduledTime: validatedData.scheduledTime || null,
        
        // Pricing
        subtotal,
        taxAmount,
        deliveryFee,
        totalAmount,
        
        // Order details
        notes: validatedData.notes || null,
        kitchenNotes: validatedData.kitchenNotes || null,
        estimatedTime: Math.max(totalPrepTime, 15), // Minimum 15 minutes
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        
        // Create order items
        orderItems: {
          create: orderItems
        }
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
        deliveryAddress: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully',
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        totalAmount: newOrder.totalAmount,
        estimatedTime: newOrder.estimatedTime,
        items: newOrder.orderItems.map(item => ({
          name: item.menuItem?.name,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice
        }))
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Order submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to submit order'
    }, { status: 500 })
  }
}
