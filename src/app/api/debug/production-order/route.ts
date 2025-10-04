import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    checks: {}
  }

  try {
    // Check database connection
    diagnostics.checks.database = { status: 'checking' }
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      diagnostics.checks.database = { status: 'connected' }
    } catch (dbError) {
      diagnostics.checks.database = { 
        status: 'error', 
        error: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }
    }

    // Check if tables exist
    diagnostics.checks.tables = {}
    
    const tablesToCheck = ['MenuItem', 'Order', 'OrderItem', 'Customer', 'TaxSettings', 'DeliverySettings', 'User']
    
    for (const table of tablesToCheck) {
      try {
        let result
        switch (table) {
          case 'MenuItem':
            result = await prisma.menuItem.findFirst({ select: { id: true } })
            break
          case 'Order':
            result = await prisma.order.findFirst({ select: { id: true } })
            break
          case 'OrderItem':
            result = await prisma.orderItem.findFirst({ select: { id: true } })
            break
          case 'Customer':
            result = await prisma.customer.findFirst({ select: { id: true } })
            break
          case 'TaxSettings':
            result = await prisma.taxSettings.findFirst({ select: { id: true } })
            break
          case 'DeliverySettings':
            result = await prisma.deliverySettings.findFirst({ select: { id: true } })
            break
          case 'User':
            result = await prisma.user.findFirst({ select: { id: true } })
            break
        }
        diagnostics.checks.tables[table] = { status: 'exists', hasData: !!result }
      } catch (tableError) {
        diagnostics.checks.tables[table] = { 
          status: 'missing_or_error', 
          error: tableError instanceof Error ? tableError.message : 'Unknown error' 
        }
      }
    }

    // Check menu items with meal types
    diagnostics.checks.menuItems = { status: 'checking' }
    try {
      const menuItems = await prisma.menuItem.findMany({
        select: {
          id: true,
          name: true,
          mealTypes: true,
          isActive: true,
          isAvailable: true
        },
        take: 5
      })
      diagnostics.checks.menuItems = { 
        status: 'success', 
        count: menuItems.length,
        sample: menuItems.map(item => ({
          id: item.id,
          name: item.name,
          mealTypes: item.mealTypes,
          mealTypesType: typeof item.mealTypes,
          isArray: Array.isArray(item.mealTypes)
        }))
      }
    } catch (menuError) {
      diagnostics.checks.menuItems = { 
        status: 'error', 
        error: menuError instanceof Error ? menuError.message : 'Unknown error' 
      }
    }

    // Check environment variables (without revealing sensitive data)
    diagnostics.checks.environment = {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDatabaseUrlNew: !!process.env.DATABASE_URL_NEW,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    }

    // Test a simple order submission payload (dry run)
    diagnostics.checks.orderValidation = { status: 'checking' }
    try {
      const testPayload = {
        orderType: 'DELIVERY' as const,
        items: [],
        guestName: 'Test User',
        guestPhone: '01700000000',
        guestAddress: 'Test Address',
        isPreOrder: false
      }

      // We won't actually submit this, just validate the structure
      const { z } = await import('zod')
      
      const orderItemSchema = z.object({
        menuItemId: z.string(),
        quantity: z.number().min(1),
        notes: z.string().optional()
      })

      const submitOrderSchema = z.object({
        orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
        items: z.array(orderItemSchema).min(1, 'At least one item is required'),
        
        // Customer information
        customerId: z.string().optional(),
        
        // Guest customer information
        guestName: z.string().optional(),
        guestPhone: z.string().optional(),
        guestEmail: z.string().optional(),
        guestAddress: z.string().optional(),
        
        // Pre-order functionality
        isPreOrder: z.boolean().default(false),
        scheduledDate: z.string().optional(),
        scheduledTime: z.string().optional(),
        
        // Order details
        tableNumber: z.string().optional(),
        deliveryAddressId: z.string().optional(),
        notes: z.string().optional(),
        kitchenNotes: z.string().optional()
      })

      // Test with empty items (should fail validation)
      try {
        submitOrderSchema.parse(testPayload)
        diagnostics.checks.orderValidation = { status: 'validation_passed_unexpectedly' }
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errors = validationError.issues.map(issue => issue.message)
          diagnostics.checks.orderValidation = { 
            status: 'validation_working', 
            expectedErrors: errors 
          }
        }
      }
    } catch (validationTestError) {
      diagnostics.checks.orderValidation = { 
        status: 'error', 
        error: validationTestError instanceof Error ? validationTestError.message : 'Unknown error' 
      }
    }

    // Check if we can create a test order number
    diagnostics.checks.orderNumber = { status: 'checking' }
    try {
      const today = new Date()
      const orderNumber = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`
      diagnostics.checks.orderNumber = { status: 'success', sample: orderNumber }
    } catch (orderNumError) {
      diagnostics.checks.orderNumber = { 
        status: 'error', 
        error: orderNumError instanceof Error ? orderNumError.message : 'Unknown error' 
      }
    }

    // Add migration recommendations
    diagnostics.recommendations = []
    
    if (diagnostics.checks.database?.status !== 'connected') {
      diagnostics.recommendations.push({
        priority: 'CRITICAL',
        issue: 'Database connection failed',
        solution: 'Check DATABASE_URL in Vercel environment variables'
      })
    }
    
    const missingTables = Object.entries(diagnostics.checks.tables || {})
      .filter(([table, check]: [string, any]) => check.status === 'missing_or_error')
    
    if (missingTables.length > 0) {
      diagnostics.recommendations.push({
        priority: 'HIGH',
        issue: `Missing database tables: ${missingTables.map(([table]) => table).join(', ')}`,
        solution: 'Use /admin/migrate endpoint to run database migrations'
      })
    }
    
    if (diagnostics.checks.menuItems?.count === 0) {
      diagnostics.recommendations.push({
        priority: 'MEDIUM',
        issue: 'No active menu items found',
        solution: 'Add menu items via admin panel at /admin/menu-items'
      })
    }
    
    if (!diagnostics.checks.environment?.hasNextAuthSecret) {
      diagnostics.recommendations.push({
        priority: 'HIGH',
        issue: 'NEXTAUTH_SECRET not configured',
        solution: 'Set NEXTAUTH_SECRET in Vercel environment variables'
      })
    }

    // Check for customer system issues
    if (diagnostics.checks.tables?.Customer?.status === 'missing_or_error') {
      diagnostics.recommendations.push({
        priority: 'HIGH',
        issue: 'Customer system not configured - missing password column',
        solution: 'Use /admin/migrate/customer-system endpoint to fix customer tables'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Production diagnostics completed',
      diagnostics
    })

  } catch (error) {
    console.error('Production diagnostics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      partialDiagnostics: diagnostics
    }, { status: 500 })
  }
}

// Also provide a simple test endpoint for order submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This will help test the exact same flow that's failing
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test order submission completed',
      response: {
        status: response.status,
        ok: response.ok,
        result
      }
    })

  } catch (error) {
    console.error('Test order submission error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test submission failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}