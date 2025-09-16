import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Emergency fix for deliveryCharge column
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json().catch(() => ({}))
    
    // Simple secret check
    if (secret !== 'emergency-fix-deliverycharge') {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 })
    }

    console.log('🚨 EMERGENCY: Adding deliveryCharge column to menu_items table')
    
    // Direct SQL execution to add the column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "menu_items" 
        ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
      `
      
      console.log('✅ Successfully added deliveryCharge column')
      
      // Verify the column was added
      const verification = await prisma.$queryRaw`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'menu_items'
        AND column_name = 'deliveryCharge'
      `
      
      return NextResponse.json({
        success: true,
        message: 'deliveryCharge column added successfully',
        verification: verification,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('❌ Failed to add deliveryCharge column:', error)
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add column',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Emergency fix error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Emergency fix failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET to check current status
export async function GET() {
  try {
    // Check if column exists
    const columnCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items'
        AND column_name = 'deliveryCharge'
        AND table_schema = 'public'
      )
    `
    
    return NextResponse.json({
      success: true,
      columnExists: Array.isArray(columnCheck) && columnCheck[0] && columnCheck[0].exists,
      message: 'Column status checked',
      usage: 'POST with {"secret": "emergency-fix-deliverycharge"} to add column',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}