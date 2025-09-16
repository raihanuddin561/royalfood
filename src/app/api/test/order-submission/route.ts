import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test order submission with mock data
export async function POST(request: NextRequest) {
  try {
    const { testType = 'basic' } = await request.json().catch(() => ({}))
    
    switch (testType) {
      case 'basic':
        return await testBasicOrderSubmission()
      case 'delivery':
        return await testDeliveryOrderSubmission()
      case 'schema':
        return await testDatabaseSchema()
      default:
        return NextResponse.json({
          error: 'Invalid test type. Use: basic, delivery, or schema'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function testBasicOrderSubmission() {
  try {
    // Get a real menu item for testing
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        isActive: true,
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        price: true
      }
    })
    
    if (!menuItem) {
      return NextResponse.json({
        success: false,
        test: 'basic',
        error: 'No active menu items found for testing',
        suggestion: 'Add menu items through admin panel first'
      })
    }
    
    // Create test order data
    const testOrderData = {
      orderType: 'PICKUP' as const,
      items: [
        {
          menuItemId: menuItem.id,
          quantity: 1,
          notes: 'Test order item'
        }
      ],
      guestName: 'Test Customer',
      guestPhone: '01234567890',
      guestEmail: 'test@example.com',
      isPreOrder: false,
      notes: 'This is a test order from the test endpoint'
    }
    
    // Submit the test order to our own API
    const orderResponse = await fetch(`${request.nextUrl.origin}/api/public/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    })
    
    const orderResult = await orderResponse.json()
    
    return NextResponse.json({
      success: orderResponse.ok,
      test: 'basic',
      testOrderData: testOrderData,
      apiResponse: orderResult,
      statusCode: orderResponse.status,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'basic',
      error: error instanceof Error ? error.message : 'Basic test failed',
      timestamp: new Date().toISOString()
    })
  }
}

async function testDeliveryOrderSubmission() {
  try {
    // Get a real menu item for testing
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        isActive: true,
        isAvailable: true
      }
    })
    
    if (!menuItem) {
      return NextResponse.json({
        success: false,
        test: 'delivery',
        error: 'No active menu items found for testing'
      })
    }
    
    // Create test delivery order data
    const testOrderData = {
      orderType: 'DELIVERY' as const,
      items: [
        {
          menuItemId: menuItem.id,
          quantity: 2,
          notes: 'Test delivery item'
        }
      ],
      guestName: 'Test Customer',
      guestPhone: '01234567890',
      guestEmail: 'test@example.com',
      guestAddress: '123 Test Street, Test City, Test Area',
      isPreOrder: false,
      notes: 'This is a test delivery order'
    }
    
    // Submit the test order
    const orderResponse = await fetch(`${request.nextUrl.origin}/api/public/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    })
    
    const orderResult = await orderResponse.json()
    
    return NextResponse.json({
      success: orderResponse.ok,
      test: 'delivery',
      testOrderData: testOrderData,
      apiResponse: orderResult,
      statusCode: orderResponse.status,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'delivery',
      error: error instanceof Error ? error.message : 'Delivery test failed',
      timestamp: new Date().toISOString()
    })
  }
}

async function testDatabaseSchema() {
  try {
    const schemaChecks: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      columns: {},
      migrations: {}
    }
    
    // Check if required tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('menu_items', 'orders', 'order_items', 'customers', '_prisma_migrations')
      ORDER BY table_name
    `
    
    schemaChecks.tables.found = tables
    schemaChecks.tables.count = Array.isArray(tables) ? tables.length : 0
    
    // Check menu_items table structure
    const menuItemsColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      ORDER BY ordinal_position
    `
    
    schemaChecks.columns.menu_items = menuItemsColumns
    
    // Check specifically for deliveryCharge column
    const deliveryChargeColumn = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name = 'deliveryCharge'
    `
    
    schemaChecks.columns.deliveryCharge = {
      exists: Array.isArray(deliveryChargeColumn) && deliveryChargeColumn.length > 0,
      details: deliveryChargeColumn
    }
    
    // Check migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at
      FROM "_prisma_migrations" 
      ORDER BY finished_at DESC 
      LIMIT 10
    `
    
    const targetMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20250914120621_add_delivery_charge_to_menu_items'
    `
    
    schemaChecks.migrations.recent = migrations
    schemaChecks.migrations.targetMigrationExists = Array.isArray(targetMigration) && targetMigration.length > 0
    schemaChecks.migrations.targetMigration = targetMigration
    
    // Summary
    const issues = []
    if (schemaChecks.tables.count < 5) {
      issues.push('Missing required tables')
    }
    if (!schemaChecks.columns.deliveryCharge.exists) {
      issues.push('Missing deliveryCharge column in menu_items table')
    }
    if (!schemaChecks.migrations.targetMigrationExists) {
      issues.push('Target migration not applied: 20250914120621_add_delivery_charge_to_menu_items')
    }
    
    schemaChecks.summary = {
      status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND',
      issues: issues,
      issueCount: issues.length
    }
    
    return NextResponse.json({
      success: true,
      test: 'schema',
      ...schemaChecks
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'schema',
      error: error instanceof Error ? error.message : 'Schema test failed',
      timestamp: new Date().toISOString()
    })
  }
}

// GET endpoint for quick status check
export async function GET() {
  try {
    // Quick health check
    await prisma.$queryRaw`SELECT 1 as test`
    
    const menuItemsCount = await prisma.menuItem.count({
      where: { isActive: true }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order test endpoint is ready',
      menuItemsAvailable: menuItemsCount,
      availableTests: ['basic', 'delivery', 'schema'],
      usage: {
        'POST /api/test/order-submission': 'Run order submission tests',
        'Body': '{"testType": "basic|delivery|schema"}'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}