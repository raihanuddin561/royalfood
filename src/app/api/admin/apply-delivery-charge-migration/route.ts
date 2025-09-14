import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  console.log('🔧 [DELIVERY_CHARGE_MIGRATION] Starting migration to add deliveryCharge column')
  
  try {
    // Check if the column already exists by trying to query it
    console.log('🔍 [DELIVERY_CHARGE_MIGRATION] Checking if deliveryCharge column exists...')
    
    try {
      await prisma.$queryRaw`SELECT "deliveryCharge" FROM "menu_items" LIMIT 1`
      console.log('✅ [DELIVERY_CHARGE_MIGRATION] Column already exists, no migration needed')
      return NextResponse.json({ 
        success: true, 
        message: 'deliveryCharge column already exists',
        alreadyExists: true 
      })
    } catch (error) {
      console.log('🔄 [DELIVERY_CHARGE_MIGRATION] Column does not exist, proceeding with migration...')
    }

    // Apply the migration
    console.log('⚡ [DELIVERY_CHARGE_MIGRATION] Adding deliveryCharge column with default value 0...')
    await prisma.$executeRaw`
      ALTER TABLE "menu_items" 
      ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
    `

    console.log('✅ [DELIVERY_CHARGE_MIGRATION] Migration completed successfully')

    // Verify the migration worked
    try {
      const testQuery = await prisma.$queryRaw`SELECT "deliveryCharge" FROM "menu_items" LIMIT 1`
      console.log('✅ [DELIVERY_CHARGE_MIGRATION] Migration verified - column is accessible')
    } catch (error) {
      console.error('❌ [DELIVERY_CHARGE_MIGRATION] Migration verification failed:', error)
      throw new Error('Migration verification failed')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'deliveryCharge column added successfully',
      applied: true 
    })

  } catch (error) {
    console.error('💥 [DELIVERY_CHARGE_MIGRATION] Migration failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply deliveryCharge migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log('🔍 [DELIVERY_CHARGE_MIGRATION] Checking deliveryCharge column status...')
  
  try {
    // Check if the column exists
    await prisma.$queryRaw`SELECT "deliveryCharge" FROM "menu_items" LIMIT 1`
    
    return NextResponse.json({ 
      success: true, 
      columnExists: true,
      message: 'deliveryCharge column exists and is accessible'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: true, 
      columnExists: false,
      message: 'deliveryCharge column does not exist',
      needsMigration: true
    })
  }
}