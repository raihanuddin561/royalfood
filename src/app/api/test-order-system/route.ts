import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      errors: []
    }

    // Test 1: Order creation
    try {
      const testOrder = await prisma.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          orderType: 'TAKEAWAY',
          status: 'PENDING',
          subtotal: 10.0,
          taxAmount: 0.0,
          deliveryFee: 0.0,
          totalAmount: 10.0,
          finalAmount: 10.0,
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          guestName: 'Test Customer',
          guestPhone: '1234567890'
        }
      })

      // Test 2: Order tracking creation
      try {
        await prisma.orderTracking.create({
          data: {
            orderId: testOrder.id,
            status: 'PENDING',
            message: 'Test tracking entry',
            timestamp: new Date()
          }
        })
        testResults.tests.orderTracking = 'SUCCESS'
      } catch (trackingError) {
        testResults.tests.orderTracking = `FAILED: ${trackingError instanceof Error ? trackingError.message : 'Unknown'}`
        testResults.errors.push('OrderTracking creation failed')
      }

      // Cleanup
      await prisma.orderTracking.deleteMany({ where: { orderId: testOrder.id } })
      await prisma.order.delete({ where: { id: testOrder.id } })
      
      testResults.tests.orderCreation = 'SUCCESS'
    } catch (orderError) {
      testResults.tests.orderCreation = `FAILED: ${orderError instanceof Error ? orderError.message : 'Unknown'}`
      testResults.errors.push('Order creation failed')
    }

    // Test 3: Admin order list
    try {
      const orders = await prisma.order.findMany({
        take: 1,
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      })
      testResults.tests.adminOrderList = 'SUCCESS'
    } catch (listError) {
      testResults.tests.adminOrderList = `FAILED: ${listError instanceof Error ? listError.message : 'Unknown'}`
      testResults.errors.push('Admin order list failed')
    }

    return NextResponse.json({
      success: testResults.errors.length === 0,
      message: testResults.errors.length === 0 ? 'All tests passed!' : `${testResults.errors.length} tests failed`,
      testResults
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test suite failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Order System Test Suite',
    usage: 'POST to run comprehensive tests',
    tests: [
      'Order creation with finalAmount',
      'OrderTracking creation with timestamp',
      'Admin order list functionality'
    ]
  })
}