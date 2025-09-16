import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      missingColumns: [],
      schemaIssues: []
    }

    // Check order_tracking table structure
    try {
      const orderTrackingColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'order_tracking' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      diagnostics.tables.order_tracking = orderTrackingColumns

      // Check if message column exists
      const hasMessageColumn = Array.isArray(orderTrackingColumns) && 
        orderTrackingColumns.some((col: any) => col.column_name === 'message')
      
      if (!hasMessageColumn) {
        diagnostics.missingColumns.push('order_tracking.message')
        diagnostics.schemaIssues.push('order_tracking table missing message column - required by admin APIs')
      }

    } catch (error) {
      diagnostics.tables.order_tracking = 'ERROR: ' + (error instanceof Error ? error.message : 'Unknown error')
      diagnostics.schemaIssues.push('Cannot access order_tracking table')
    }

    // Check orders table structure  
    try {
      const ordersColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      diagnostics.tables.orders = ordersColumns

      // Check if finalAmount column exists
      const hasFinalAmountColumn = Array.isArray(ordersColumns) && 
        ordersColumns.some((col: any) => col.column_name === 'finalAmount')
      
      if (!hasFinalAmountColumn) {
        diagnostics.missingColumns.push('orders.finalAmount')
        diagnostics.schemaIssues.push('orders table missing finalAmount column - causes order creation failures')
      }

    } catch (error) {
      diagnostics.tables.orders = 'ERROR: ' + (error instanceof Error ? error.message : 'Unknown error')
      diagnostics.schemaIssues.push('Cannot access orders table')
    }

    // Check if tax_settings and delivery_settings tables exist
    try {
      await prisma.taxSettings.findFirst()
      diagnostics.tables.tax_settings = 'EXISTS'
    } catch (error) {
      diagnostics.tables.tax_settings = 'MISSING'
      diagnostics.schemaIssues.push('tax_settings table missing - order calculation may fail')
    }

    try {
      await prisma.deliverySettings.findFirst()
      diagnostics.tables.delivery_settings = 'EXISTS'
    } catch (error) {
      diagnostics.tables.delivery_settings = 'MISSING'
      diagnostics.schemaIssues.push('delivery_settings table missing - delivery fee calculation may fail')
    }

    // Test order creation capabilities
    let orderCreationTest = null
    try {
      // Try to create a test order to see what fails
      const testData = {
        orderNumber: 'SCHEMA-TEST-' + Date.now(),
        orderType: 'TAKEAWAY' as const,
        status: 'PENDING' as const,
        subtotal: 10.0,
        taxAmount: 0.0,
        deliveryFee: 0.0,
        totalAmount: 10.0,
        paymentMethod: 'CASH' as const,
        paymentStatus: 'PENDING' as const,
        guestName: 'Test',
        guestPhone: '1234567890'
      }

      const testOrder = await prisma.order.create({ data: testData })
      await prisma.order.delete({ where: { id: testOrder.id } })
      orderCreationTest = 'SUCCESS'
    } catch (error) {
      orderCreationTest = 'FAILED: ' + (error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.message.includes('finalAmount')) {
        diagnostics.schemaIssues.push('Order creation fails due to missing finalAmount column')
      }
    }

    diagnostics.orderCreationTest = orderCreationTest
    diagnostics.summary = {
      totalIssues: diagnostics.schemaIssues.length,
      missingColumnsCount: diagnostics.missingColumns.length,
      criticalIssues: diagnostics.schemaIssues.filter((issue: string) => 
        issue.includes('missing') || issue.includes('fails')
      ).length
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema diagnostics failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { secret, action } = await request.json().catch(() => ({}))
    
    if (secret !== 'sync-schema-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 })
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      action,
      changes: [],
      errors: []
    }

    if (action === 'fix-order-tracking' || action === 'fix-all') {
      // Add message column to order_tracking table
      try {
        await prisma.$executeRaw`
          ALTER TABLE "order_tracking" 
          ADD COLUMN IF NOT EXISTS "message" TEXT
        `
        results.changes.push('Added message column to order_tracking table')
      } catch (error) {
        results.errors.push(`order_tracking.message: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Add estimatedTime column if missing
      try {
        await prisma.$executeRaw`
          ALTER TABLE "order_tracking" 
          ADD COLUMN IF NOT EXISTS "estimatedTime" INTEGER
        `
        results.changes.push('Added estimatedTime column to order_tracking table')
      } catch (error) {
        results.errors.push(`order_tracking.estimatedTime: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Add updatedBy column if missing
      try {
        await prisma.$executeRaw`
          ALTER TABLE "order_tracking" 
          ADD COLUMN IF NOT EXISTS "updatedBy" TEXT
        `
        results.changes.push('Added updatedBy column to order_tracking table')
      } catch (error) {
        results.errors.push(`order_tracking.updatedBy: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (action === 'fix-orders' || action === 'fix-all') {
      // Add finalAmount column to orders table
      try {
        await prisma.$executeRaw`
          ALTER TABLE "orders" 
          ADD COLUMN IF NOT EXISTS "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
        `
        results.changes.push('Added finalAmount column to orders table')

        // Update existing orders
        await prisma.$executeRaw`
          UPDATE "orders" 
          SET "finalAmount" = "totalAmount" 
          WHERE "finalAmount" = 0 OR "finalAmount" IS NULL
        `
        results.changes.push('Updated existing orders with finalAmount = totalAmount')

      } catch (error) {
        results.errors.push(`orders.finalAmount: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Add discountAmount column if missing (with default)
      try {
        await prisma.$executeRaw`
          ALTER TABLE "orders" 
          ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
        `
        results.changes.push('Added discountAmount column to orders table')
      } catch (error) {
        results.errors.push(`orders.discountAmount: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? 'Schema synchronization completed' : 'Completed with some errors',
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema sync failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}