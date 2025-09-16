import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json().catch(() => ({}))
    
    if (secret !== 'fix-final-amount-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 })
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      steps: [],
      errors: []
    }

    // Step 1: Check if finalAmount column exists
    try {
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders'
          AND column_name = 'finalAmount'
          AND table_schema = 'public'
        )
      `
      const hasColumn = Array.isArray(columnExists) && columnExists[0] && columnExists[0].exists
      
      if (!hasColumn) {
        // Step 2: Add finalAmount column
        await prisma.$executeRaw`
          ALTER TABLE "orders" 
          ADD COLUMN "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
        `
        results.steps.push('Added finalAmount column to orders table')
      } else {
        results.steps.push('finalAmount column already exists')
      }
    } catch (error) {
      results.errors.push(`Column check/creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Step 3: Update existing orders to set finalAmount = totalAmount
    try {
      const updateResult = await prisma.$executeRaw`
        UPDATE "orders" 
        SET "finalAmount" = "totalAmount" 
        WHERE "finalAmount" = 0 OR "finalAmount" IS NULL
      `
      results.steps.push(`Updated ${updateResult} orders with finalAmount = totalAmount`)
    } catch (error) {
      results.errors.push(`Update existing orders failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? 'finalAmount migration completed successfully' : 'Migration completed with some errors',
      results
    })

  } catch (error) {
    console.error('finalAmount migration error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check current finalAmount status
    const checks: any = {
      timestamp: new Date().toISOString(),
      columnExists: false,
      ordersWithoutFinalAmount: 0,
      sampleOrders: []
    }

    // Check if column exists
    try {
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders'
          AND column_name = 'finalAmount'
          AND table_schema = 'public'
        )
      `
      checks.columnExists = Array.isArray(columnExists) && columnExists[0] && columnExists[0].exists
    } catch (error) {
      checks.columnCheckError = error instanceof Error ? error.message : 'Unknown error'
    }

    if (checks.columnExists) {
      // Count orders without finalAmount
      try {
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "orders" 
          WHERE "finalAmount" = 0 OR "finalAmount" IS NULL
        `
        checks.ordersWithoutFinalAmount = Array.isArray(countResult) && countResult[0] ? Number(countResult[0].count) : 0

        // Get sample orders
        const samples = await prisma.$queryRaw`
          SELECT "id", "orderNumber", "totalAmount", "finalAmount"
          FROM "orders" 
          ORDER BY "createdAt" DESC 
          LIMIT 5
        `
        checks.sampleOrders = samples
      } catch (error) {
        checks.queryError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      checks,
      usage: 'POST with {"secret": "fix-final-amount-2024"} to apply migration'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}