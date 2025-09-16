import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check the actual schema of the orders table
    const ordersTableColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    // Try to create a test order to see what fields are actually required
    let orderCreationTest = null
    try {
      // First try with just totalAmount
      await prisma.order.create({
        data: {
          orderNumber: 'TEST-SCHEMA-CHECK-1',
          orderType: 'TAKEAWAY',
          status: 'PENDING',
          subtotal: 10.0,
          taxAmount: 0.0,
          deliveryFee: 0.0,
          totalAmount: 10.0,
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING'
        }
      })
      orderCreationTest = 'SUCCESS: totalAmount only'
      
      // Clean up test order
      await prisma.order.deleteMany({
        where: { orderNumber: 'TEST-SCHEMA-CHECK-1' }
      })
    } catch (testError) {
      orderCreationTest = `FAILED: ${testError instanceof Error ? testError.message : 'Unknown error'}`
    }

    return NextResponse.json({
      success: true,
      ordersTableSchema: ordersTableColumns,
      orderCreationTest,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json().catch(() => ({}))
    
    if (secret !== 'fix-schema-drift-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 })
    }

    // Check if finalAmount column exists in orders table
    const finalAmountExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders'
        AND column_name = 'finalAmount'
        AND table_schema = 'public'
      )
    `

    const hasColumn = Array.isArray(finalAmountExists) && finalAmountExists[0] && finalAmountExists[0].exists

    if (hasColumn) {
      // If finalAmount exists, we need to set it in our order creation
      return NextResponse.json({
        success: true,
        message: 'finalAmount column exists in orders table',
        action: 'Need to update order creation to include finalAmount',
        columnExists: true
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'finalAmount column does not exist in orders table',
        action: 'No action needed - use totalAmount only',
        columnExists: false
      })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema fix check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}