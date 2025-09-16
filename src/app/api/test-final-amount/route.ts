import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Test creating an order with finalAmount included
    const testOrderData = {
      orderNumber: `TEST-${Date.now()}`,
      orderType: 'TAKEAWAY' as const,
      status: 'PENDING' as const,
      subtotal: 25.99,
      taxAmount: 2.60,
      deliveryFee: 0.0,
      totalAmount: 28.59,
      finalAmount: 28.59, // This should fix the null constraint violation
      paymentMethod: 'CASH' as const,
      paymentStatus: 'PENDING' as const,
      guestName: 'Test Customer',
      guestPhone: '1234567890'
    }

    console.log('Testing order creation with finalAmount...')
    
    const newOrder = await prisma.order.create({
      data: testOrderData
    })

    // Clean up test order
    await prisma.order.delete({
      where: { id: newOrder.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Order creation test passed!',
      testResults: {
        orderCreated: true,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        finalAmount: newOrder.finalAmount,
        totalAmount: newOrder.totalAmount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Order creation test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      errorType: error instanceof Error && error.message.includes('finalAmount') ? 'FINAL_AMOUNT_ERROR' : 'OTHER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test order creation with finalAmount field',
    usage: 'POST to this endpoint to test if finalAmount constraint is fixed'
  })
}