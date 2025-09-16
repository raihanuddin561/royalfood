import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Direct database diagnostic and fix for deliveryCharge column
export async function GET(request: NextRequest) {
  try {
    const diagnostic: any = {
      timestamp: new Date().toISOString(),
      step: 'starting-diagnosis'
    }

    // Check if table exists
    diagnostic.step = 'checking-table-existence'
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
      )
    `
    diagnostic.tableExists = tableExists

    // Get all columns in menu_items table
    diagnostic.step = 'getting-all-columns'
    const allColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    diagnostic.allColumns = allColumns

    // Check for deliveryCharge column (case sensitive)
    diagnostic.step = 'checking-deliverycharge-column'
    const deliveryChargeColumn = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      AND table_schema = 'public'
      AND column_name = 'deliveryCharge'
    `
    diagnostic.deliveryChargeColumn = deliveryChargeColumn

    // Check for deliverycharge column (lowercase)
    diagnostic.step = 'checking-lowercase-deliverycharge'
    const deliveryChargeColumnLower = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      AND table_schema = 'public'
      AND LOWER(column_name) = 'deliverycharge'
    `
    diagnostic.deliveryChargeColumnLower = deliveryChargeColumnLower

    // Check applied migrations
    diagnostic.step = 'checking-applied-migrations'
    try {
      const appliedMigrations = await prisma.$queryRaw`
        SELECT filename, applied_at 
        FROM applied_migrations 
        WHERE filename LIKE '%delivery%'
        ORDER BY applied_at DESC
      `
      diagnostic.appliedMigrations = appliedMigrations
    } catch (migrationTableError) {
      diagnostic.appliedMigrations = 'Migration table not accessible'
      diagnostic.migrationTableError = migrationTableError instanceof Error ? migrationTableError.message : 'Unknown error'
    }

    // Check Prisma migrations table
    diagnostic.step = 'checking-prisma-migrations'
    try {
      const prismaMigrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM "_prisma_migrations" 
        WHERE migration_name LIKE '%delivery%'
        ORDER BY finished_at DESC
      `
      diagnostic.prismaMigrations = prismaMigrations
    } catch (prismaTableError) {
      diagnostic.prismaMigrations = 'Prisma migration table not accessible'
      diagnostic.prismaTableError = prismaTableError instanceof Error ? prismaTableError.message : 'Unknown error'
    }

    // Try to access a menu item to see current structure
    diagnostic.step = 'checking-menu-item-structure'
    try {
      const sampleMenuItem = await prisma.menuItem.findFirst({
        select: {
          id: true,
          name: true,
          price: true
        }
      })
      diagnostic.sampleMenuItem = sampleMenuItem
    } catch (menuItemError) {
      diagnostic.menuItemError = menuItemError instanceof Error ? menuItemError.message : 'Unknown error'
    }

    // Summary
    const hasDeliveryCharge = Array.isArray(deliveryChargeColumn) && deliveryChargeColumn.length > 0
    const hasDeliveryChargeLower = Array.isArray(deliveryChargeColumnLower) && deliveryChargeColumnLower.length > 0
    
    diagnostic.summary = {
      hasDeliveryChargeColumn: hasDeliveryCharge,
      hasDeliveryChargeColumnAnyCase: hasDeliveryChargeLower,
      totalColumns: Array.isArray(allColumns) ? allColumns.length : 0,
      needsMigration: !hasDeliveryCharge
    }

    return NextResponse.json({
      success: true,
      diagnostic
    })

  } catch (error) {
    console.error('Database diagnostic error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Diagnostic failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST to force apply the column
export async function POST(request: NextRequest) {
  try {
    const { action = 'add-column', force = false } = await request.json().catch(() => ({}))
    
    const result: any = {
      timestamp: new Date().toISOString(),
      action,
      steps: []
    }

    if (action === 'add-column') {
      // Step 1: Check if column exists
      result.steps.push('Checking if deliveryCharge column exists')
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'menu_items'
          AND table_schema = 'public'
          AND column_name = 'deliveryCharge'
        )
      `
      
      const exists = Array.isArray(columnExists) && columnExists[0] && columnExists[0].exists
      result.columnExistsCheck = { exists, raw: columnExists }

      if (exists && !force) {
        return NextResponse.json({
          success: true,
          message: 'deliveryCharge column already exists',
          result
        })
      }

      // Step 2: Add the column if it doesn't exist
      if (!exists || force) {
        result.steps.push('Adding deliveryCharge column to menu_items table')
        
        try {
          await prisma.$executeRaw`
            ALTER TABLE "menu_items" 
            ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
          `
          result.steps.push('Column added successfully')
        } catch (alterError) {
          result.steps.push(`Column addition failed: ${alterError instanceof Error ? alterError.message : 'Unknown error'}`)
          
          // Try alternative approach
          result.steps.push('Trying alternative column addition approach')
          await prisma.$executeRaw`
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'menu_items' 
                AND column_name = 'deliveryCharge'
              ) THEN
                ALTER TABLE "menu_items" ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
              END IF;
            END $$
          `
          result.steps.push('Alternative approach completed')
        }
      }

      // Step 3: Verify column was added
      result.steps.push('Verifying column addition')
      const verifyColumn = await prisma.$queryRaw`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'menu_items'
        AND table_schema = 'public'
        AND column_name = 'deliveryCharge'
      `
      result.verification = verifyColumn
      result.columnAdded = Array.isArray(verifyColumn) && verifyColumn.length > 0

      // Step 4: Update Prisma client schema if needed
      result.steps.push('Generating updated Prisma client')
      try {
        // This would be ideal but we can't run prisma generate in serverless
        result.steps.push('Note: Prisma client may need regeneration after deployment')
      } catch (generateError) {
        result.steps.push('Prisma generation skipped in serverless environment')
      }

      return NextResponse.json({
        success: result.columnAdded,
        message: result.columnAdded ? 'deliveryCharge column added successfully' : 'Failed to add deliveryCharge column',
        result
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: add-column'
    }, { status: 400 })

  } catch (error) {
    console.error('Direct database fix error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database fix failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}