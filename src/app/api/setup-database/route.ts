import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Comprehensive database setup for missing tables
export async function POST(request: NextRequest) {
  try {
    const { secret, action = 'setup-all' } = await request.json().catch(() => ({}))
    
    if (secret !== 'setup-missing-tables-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 })
    }

    const setupResults: any = {
      timestamp: new Date().toISOString(),
      action,
      tablesCreated: [],
      errors: []
    }

    if (action === 'setup-all' || action === 'tax-settings') {
      // Create tax_settings table
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "tax_settings" (
            "id" TEXT NOT NULL,
            "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "isTaxActive" BOOLEAN NOT NULL DEFAULT false,
            "taxLabel" TEXT NOT NULL DEFAULT 'Tax',
            "includeInPrice" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
          )
        `
        
        // Insert default tax settings
        await prisma.$executeRaw`
          INSERT INTO "tax_settings" (id, "taxRate", "isTaxActive", "taxLabel", "includeInPrice", "createdAt", "updatedAt")
          VALUES ('default', 0.0, false, 'Tax', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `
        
        setupResults.tablesCreated.push('tax_settings')
      } catch (error) {
        setupResults.errors.push(`tax_settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (action === 'setup-all' || action === 'delivery-settings') {
      // Create delivery_settings table
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "delivery_settings" (
            "id" TEXT NOT NULL,
            "globalDeliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "freeDeliveryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "isGlobalChargeActive" BOOLEAN NOT NULL DEFAULT false,
            "maxDeliveryDistance" DOUBLE PRECISION NOT NULL DEFAULT 10,
            "deliveryTimeSlots" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "delivery_settings_pkey" PRIMARY KEY ("id")
          )
        `
        
        // Insert default delivery settings
        await prisma.$executeRaw`
          INSERT INTO "delivery_settings" (id, "globalDeliveryCharge", "freeDeliveryThreshold", "isGlobalChargeActive", "maxDeliveryDistance", "createdAt", "updatedAt")
          VALUES ('default', 0.0, 0.0, false, 10.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `
        
        setupResults.tablesCreated.push('delivery_settings')
      } catch (error) {
        setupResults.errors.push(`delivery_settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (action === 'setup-all' || action === 'delivery-charge-column') {
      // Add deliveryCharge column to menu_items
      try {
        await prisma.$executeRaw`
          ALTER TABLE "menu_items" 
          ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
        `
        
        setupResults.tablesCreated.push('menu_items.deliveryCharge column')
      } catch (error) {
        setupResults.errors.push(`deliveryCharge column: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: setupResults.errors.length === 0,
      message: setupResults.errors.length === 0 ? 'Database setup completed successfully' : 'Database setup completed with some errors',
      results: setupResults
    })

  } catch (error) {
    console.error('Database setup error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database setup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET to check what tables are missing
export async function GET() {
  try {
    const checks: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      columns: {},
      missingItems: []
    }

    // Check tax_settings table
    try {
      const taxSettings = await prisma.taxSettings.findFirst()
      checks.tables.tax_settings = 'EXISTS'
    } catch (error) {
      checks.tables.tax_settings = 'MISSING'
      checks.missingItems.push('tax_settings table')
    }

    // Check delivery_settings table
    try {
      const deliverySettings = await prisma.deliverySettings.findFirst()
      checks.tables.delivery_settings = 'EXISTS'
    } catch (error) {
      checks.tables.delivery_settings = 'MISSING'
      checks.missingItems.push('delivery_settings table')
    }

    // Check deliveryCharge column
    try {
      const columnCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'menu_items'
          AND column_name = 'deliveryCharge'
          AND table_schema = 'public'
        )
      `
      const exists = Array.isArray(columnCheck) && columnCheck[0] && columnCheck[0].exists
      checks.columns.deliveryCharge = exists ? 'EXISTS' : 'MISSING'
      if (!exists) {
        checks.missingItems.push('deliveryCharge column in menu_items')
      }
    } catch (error) {
      checks.columns.deliveryCharge = 'ERROR'
      checks.missingItems.push('deliveryCharge column (error checking)')
    }

    checks.summary = {
      allTablesExist: checks.missingItems.length === 0,
      missingCount: checks.missingItems.length,
      needsSetup: checks.missingItems.length > 0
    }

    return NextResponse.json({
      success: true,
      checks,
      usage: 'POST with {"secret": "setup-missing-tables-2024", "action": "setup-all"} to create missing tables'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}