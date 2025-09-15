import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

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
      
      // Validate meal-specific time cutoffs
      if (validatedData.scheduledTime) {
        const now = new Date()
        const selectedDate = new Date(validatedData.scheduledDate)
        selectedDate.setHours(0, 0, 0, 0)
        
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentTime = currentHour * 60 + currentMinute
        
        if (validatedData.scheduledTime === 'breakfast') {
          // For breakfast: must order before 11:59 PM the day before the selected date
          const dayBeforeSelected = new Date(selectedDate)
          dayBeforeSelected.setDate(dayBeforeSelected.getDate() - 1)
          dayBeforeSelected.setHours(23, 59, 0, 0)
          
          if (now > dayBeforeSelected) {
            return NextResponse.json({
              success: false,
              error: `Breakfast orders must be placed before 11:59 PM the day before selected date. Current time: ${now.toLocaleString()}`
            }, { status: 400 })
          }
        } else if (validatedData.scheduledTime === 'lunch' || validatedData.scheduledTime === 'dinner') {
          // For lunch/dinner: must order before 10:30 AM on the selected date
          const cutoffDateTime = new Date(selectedDate)
          cutoffDateTime.setHours(10, 30, 0, 0)
          
          if (now > cutoffDateTime) {
            return NextResponse.json({
              success: false,
              error: `${validatedData.scheduledTime.charAt(0).toUpperCase() + validatedData.scheduledTime.slice(1)} orders must be placed before 10:30 AM on selected date. Current time: ${now.toLocaleString()}`
            }, { status: 400 })
          }
        }
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
        prepTime: true,
        deliveryCharge: true
      }
    })
    
    if (menuItems.length !== menuItemIds.length) {
      // Find which items are unavailable
      const availableItemIds = menuItems.map(item => item.id)
      const unavailableItemIds = menuItemIds.filter(id => !availableItemIds.includes(id))
      
      return NextResponse.json({
        success: false,
        error: 'Some menu items in your cart are no longer available. Please refresh the menu and try again.',
        unavailableItems: unavailableItemIds
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
    // Get tax settings from database
    const taxSettings = await prisma.taxSettings.findFirst()
    const taxRate = taxSettings?.isTaxActive ? (taxSettings.taxRate || 0) : 0
    const taxAmount = subtotal * taxRate
    
    // Get global delivery settings
    const deliverySettings = await prisma.deliverySettings.findFirst()
    
    // Calculate delivery fee based on items' delivery charges and global settings
    let deliveryFee = 0
    if (validatedData.orderType === 'DELIVERY') {
      // Calculate item-specific delivery charges (only if they are set above 0)
      const itemDeliveryCharges = validatedData.items.reduce((total, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
        const itemDeliveryCharge = menuItem.deliveryCharge || 0
        // Only add delivery charge if it's explicitly set (greater than 0)
        return total + (itemDeliveryCharge > 0 ? itemDeliveryCharge * item.quantity : 0)
      }, 0)
      
      // Use global delivery charge if no item-specific charges and global is active
      if (itemDeliveryCharges === 0 && deliverySettings?.isGlobalChargeActive && deliverySettings?.globalDeliveryCharge > 0) {
        deliveryFee = deliverySettings.globalDeliveryCharge
      } else {
        deliveryFee = itemDeliveryCharges
      }
      
      // Apply free delivery threshold
      if (deliverySettings?.freeDeliveryThreshold && deliverySettings.freeDeliveryThreshold > 0 && subtotal >= deliverySettings.freeDeliveryThreshold) {
        deliveryFee = 0
      }
    }
    
    const totalAmount = subtotal + taxAmount + deliveryFee
    
    // Generate order number
    const today = new Date()
    const orderNumber = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`
    
    // Estimate preparation time
    const totalPrepTime = validatedData.items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      return total + (menuItem.prepTime || 15) * item.quantity
    }, 0)
    
    // Create order (try to find a system user, but proceed even if none exists)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    // Note: We'll proceed with order creation even if no admin user exists
    // This allows public orders to work without requiring admin setup
    
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: validatedData.customerId || null,
        deliveryAddressId: validatedData.deliveryAddressId || null,
        ...(systemUser?.id ? { userId: systemUser.id } : {}),
        
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
    
    // Generate guest access token for success page (for guest orders)
    let guestToken = null
    if (!validatedData.customerId) {
      guestToken = crypto
        .createHash('sha256')
        .update(`${newOrder.id}-${newOrder.guestPhone || newOrder.guestEmail || newOrder.guestName}-${process.env.GUEST_TOKEN_SECRET || 'default-secret'}`)
        .digest('hex')
        .substring(0, 16)
    }
    
    // Prepare success page URL
    const successUrl = validatedData.customerId 
      ? `/order/success?orderId=${newOrder.id}`
      : `/order/success?orderId=${newOrder.id}&token=${guestToken}`
    
    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully',
      redirectUrl: successUrl,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        totalAmount: newOrder.totalAmount,
        estimatedTime: newOrder.estimatedTime,
        items: (newOrder as any).orderItems?.map((item: any) => ({
          name: item.menuItem?.name,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice
        })) || []
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
