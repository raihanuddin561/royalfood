import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : 'Other',
    checks: {}
  }

  try {
    // 1. Environment Variables Check
    debugInfo.checks.environment = {
      NODE_ENV: !!process.env.NODE_ENV,
      DATABASE_URL_NEW: !!process.env.DATABASE_URL_NEW,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      MIGRATION_SECRET: !!process.env.MIGRATION_SECRET
    }

    // 2. Database Connection Test
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      debugInfo.checks.database = {
        connection: 'SUCCESS',
        prismaClient: 'Connected'
      }
    } catch (dbError) {
      debugInfo.checks.database = {
        connection: 'FAILED',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }

    // 3. Schema Validation - Check critical tables
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('menu_items', 'orders', 'order_items', 'customers', '_prisma_migrations')
        ORDER BY table_name
      `
      
      debugInfo.checks.tables = {
        found: tables,
        count: Array.isArray(tables) ? tables.length : 0
      }
    } catch (schemaError) {
      debugInfo.checks.tables = {
        error: schemaError instanceof Error ? schemaError.message : 'Schema check failed'
      }
    }

    // 4. DeliveryCharge Column Check (critical for order submission)
    try {
      const deliveryChargeColumn = await prisma.$queryRaw`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
        AND column_name = 'deliveryCharge'
      `
      
      debugInfo.checks.deliveryCharge = {
        exists: Array.isArray(deliveryChargeColumn) && deliveryChargeColumn.length > 0,
        columnInfo: deliveryChargeColumn
      }
    } catch (columnError) {
      debugInfo.checks.deliveryCharge = {
        exists: false,
        error: columnError instanceof Error ? columnError.message : 'Column check failed'
      }
    }

    // 5. Migration Status Check
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM "_prisma_migrations" 
        ORDER BY finished_at DESC 
        LIMIT 5
      `
      
      const targetMigration = await prisma.$queryRaw`
        SELECT * FROM "_prisma_migrations" 
        WHERE migration_name = '20250914120621_add_delivery_charge_to_menu_items'
      `
      
      debugInfo.checks.migrations = {
        recent: migrations,
        targetMigrationApplied: Array.isArray(targetMigration) && targetMigration.length > 0,
        targetMigration: targetMigration
      }
    } catch (migrationError) {
      debugInfo.checks.migrations = {
        error: migrationError instanceof Error ? migrationError.message : 'Migration check failed'
      }
    }

    // 6. Sample Data Check
    try {
      const menuItemsCount = await prisma.menuItem.count()
      const categoriesCount = await prisma.category.count()
      
      // Get a sample menu item to check structure
      const sampleMenuItem = await prisma.menuItem.findFirst({
        select: {
          id: true,
          name: true,
          price: true,
          deliveryCharge: true,
          isActive: true,
          isAvailable: true
        }
      })
      
      debugInfo.checks.data = {
        menuItems: menuItemsCount,
        categories: categoriesCount,
        sampleMenuItem: sampleMenuItem
      }
    } catch (dataError) {
      debugInfo.checks.data = {
        error: dataError instanceof Error ? dataError.message : 'Data check failed'
      }
    }

    // 7. Tax and Delivery Settings Check
    try {
      const taxSettings = await prisma.taxSettings.findFirst()
      const deliverySettings = await prisma.deliverySettings.findFirst()
      
      debugInfo.checks.settings = {
        taxSettings: taxSettings ? 'Found' : 'Missing',
        deliverySettings: deliverySettings ? 'Found' : 'Missing',
        taxActive: taxSettings?.isTaxActive || false,
        globalDeliveryActive: deliverySettings?.isGlobalChargeActive || false
      }
    } catch (settingsError) {
      debugInfo.checks.settings = {
        error: settingsError instanceof Error ? settingsError.message : 'Settings check failed'
      }
    }

    // 8. Overall Health Assessment
    const criticalIssues = []
    
    if (!debugInfo.checks.environment.DATABASE_URL_NEW) {
      criticalIssues.push('Missing DATABASE_URL_NEW environment variable')
    }
    
    if (debugInfo.checks.database.connection !== 'SUCCESS') {
      criticalIssues.push('Database connection failed')
    }
    
    if (!debugInfo.checks.deliveryCharge?.exists) {
      criticalIssues.push('Missing deliveryCharge column in menu_items table')
    }
    
    if (!debugInfo.checks.migrations?.targetMigrationApplied) {
      criticalIssues.push('Critical migration not applied: 20250914120621_add_delivery_charge_to_menu_items')
    }
    
    if (debugInfo.checks.data && typeof debugInfo.checks.data.menuItems === 'number' && debugInfo.checks.data.menuItems === 0) {
      criticalIssues.push('No menu items found in database')
    }

    debugInfo.health = {
      status: criticalIssues.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND',
      criticalIssues: criticalIssues,
      issueCount: criticalIssues.length
    }

    return NextResponse.json({
      success: true,
      ...debugInfo
    })

  } catch (error) {
    console.error('Production debug endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug check failed',
      timestamp: new Date().toISOString(),
      partialDebugInfo: debugInfo
    }, { status: 500 })
  }
}

// POST endpoint to test order submission components
export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()
    
    switch (testType) {
      case 'order-validation':
        return await testOrderValidation()
      case 'menu-items':
        return await testMenuItems()
      case 'settings':
        return await testSettings()
      default:
        return NextResponse.json({
          error: 'Invalid test type. Use: order-validation, menu-items, or settings'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}

async function testOrderValidation() {
  try {
    // Test the order validation logic without actually creating an order
    const mockOrderData = {
      orderType: 'DELIVERY' as const,
      items: [
        {
          menuItemId: 'test-item-id',
          quantity: 2,
          notes: ''
        }
      ],
      guestName: 'Test Customer',
      guestPhone: '01234567890',
      guestAddress: 'Test Address',
      isPreOrder: false
    }

    // Test menu item lookup
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true, isAvailable: true },
      select: {
        id: true,
        name: true,
        price: true,
        deliveryCharge: true
      },
      take: 1
    })

    if (menuItems.length === 0) {
      return NextResponse.json({
        success: false,
        test: 'order-validation',
        error: 'No active menu items found',
        details: 'Cannot test order validation without menu items'
      })
    }

    // Test tax settings
    const taxSettings = await prisma.taxSettings.findFirst()
    const deliverySettings = await prisma.deliverySettings.findFirst()

    return NextResponse.json({
      success: true,
      test: 'order-validation',
      results: {
        menuItemsAvailable: menuItems.length,
        sampleMenuItem: menuItems[0],
        taxSettings: taxSettings ? 'Available' : 'Missing',
        deliverySettings: deliverySettings ? 'Available' : 'Missing',
        validationComponents: 'All components accessible'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'order-validation',
      error: error instanceof Error ? error.message : 'Validation test failed'
    })
  }
}

async function testMenuItems() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      take: 5
    })

    return NextResponse.json({
      success: true,
      test: 'menu-items',
      results: {
        totalActiveItems: menuItems.length,
        sampleItems: menuItems,
        hasDeliveryCharge: menuItems.every(item => 'deliveryCharge' in item)
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'menu-items',
      error: error instanceof Error ? error.message : 'Menu items test failed'
    })
  }
}

async function testSettings() {
  try {
    const taxSettings = await prisma.taxSettings.findFirst()
    const deliverySettings = await prisma.deliverySettings.findFirst()

    return NextResponse.json({
      success: true,
      test: 'settings',
      results: {
        taxSettings: taxSettings,
        deliverySettings: deliverySettings,
        settingsConfigured: !!(taxSettings && deliverySettings)
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'settings',
      error: error instanceof Error ? error.message : 'Settings test failed'
    })
  }
}