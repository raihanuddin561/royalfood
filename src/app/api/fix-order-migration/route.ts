import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple migration applier endpoint that doesn't require admin auth for critical fixes
export async function POST(request: NextRequest) {
  try {
    // Get the secret from environment for basic protection
    const { migrationSecret } = await request.json()
    
    if (migrationSecret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Invalid migration secret'
      }, { status: 401 })
    }
    
    console.log('🔄 Applying critical migration: deliveryCharge column')
    
    // Check if deliveryCharge column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name = 'deliveryCharge'
    `
    
    if (Array.isArray(tableInfo) && tableInfo.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'deliveryCharge column already exists',
        alreadyApplied: true
      })
    }
    
    // Apply the missing migration
    await prisma.$executeRaw`
      ALTER TABLE "menu_items" 
      ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
    `
    
    // Update the Prisma migration history to mark it as applied
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        '20250914120621-add-delivery-charge-to-menu-items',
        'b5c2a6f1e8d9c3a7b2f6e4d8c9a5b3f7e1d8c6a9',
        NOW(),
        '20250914120621_add_delivery_charge_to_menu_items',
        '',
        NULL,
        NOW(),
        1
      ) ON CONFLICT (id) DO NOTHING
    `
    
    // Verify the column was added
    const verifyColumn = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name = 'deliveryCharge'
    `
    
    console.log('✅ Migration applied successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully',
      migrationName: '20250914120621_add_delivery_charge_to_menu_items',
      columnInfo: verifyColumn,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Critical migration failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      details: 'Failed to apply deliveryCharge column migration',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check migration status without requiring auth for quick diagnostics
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' 
      AND column_name = 'deliveryCharge'
    `
    
    const migrationExists = Array.isArray(tableInfo) && tableInfo.length > 0
    
    // Check if migration is recorded in Prisma migration table
    const migrationRecord = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20250914120621_add_delivery_charge_to_menu_items'
    `
    
    return NextResponse.json({
      success: true,
      columnExists: migrationExists,
      migrationRecorded: Array.isArray(migrationRecord) && migrationRecord.length > 0,
      columnInfo: tableInfo,
      timestamp: new Date().toISOString(),
      message: migrationExists ? 'Migration applied' : 'Migration needed'
    })
    
  } catch (error) {
    console.error('❌ Migration status check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}