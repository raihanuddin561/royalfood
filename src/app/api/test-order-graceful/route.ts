import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const testOrderData = {
      customerName: "Test Customer",
      customerPhone: "1234567890",
      customerAddress: "123 Test Street",
      items: [
        {
          id: "test-item-1",
          name: "Test Pizza",
          price: 15.99,
          quantity: 2,
          total: 31.98
        }
      ],
      subtotal: 31.98,
      total: 31.98,
      paymentMethod: "cash",
      notes: "Test order submission"
    }

    console.log('Testing order submission with graceful handling...')
    
    // Test the actual order submission endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const submitResponse = await fetch(`${baseUrl}/api/public/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    })

    const submitResult = await submitResponse.json()

    return NextResponse.json({
      success: true,
      testResults: {
        timestamp: new Date().toISOString(),
        orderSubmissionTest: {
          status: submitResponse.status,
          success: submitResponse.ok,
          response: submitResult
        }
      },
      message: submitResponse.ok ? 'Order submission test passed!' : 'Order submission test failed'
    })

  } catch (error) {
    console.error('Order test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Quick database connectivity test
    const dbTest = {
      timestamp: new Date().toISOString(),
      connectivity: true,
      tablesAccessible: {},
      errorTests: []
    }

    // Test menu items (should work)
    try {
      const menuCount = await prisma.menuItem.count()
      dbTest.tablesAccessible.menu_items = `✓ ${menuCount} items`
    } catch (error) {
      dbTest.tablesAccessible.menu_items = `✗ ${error instanceof Error ? error.message : 'Error'}`
    }

    // Test tax settings (might fail gracefully)
    try {
      const taxSettings = await prisma.taxSettings.findFirst()
      dbTest.tablesAccessible.tax_settings = taxSettings ? '✓ Found settings' : '✓ No settings found'
    } catch (error) {
      dbTest.tablesAccessible.tax_settings = `✗ ${error instanceof Error ? error.message : 'Error'}`
      dbTest.errorTests.push('tax_settings table missing')
    }

    // Test delivery settings (might fail gracefully)
    try {
      const deliverySettings = await prisma.deliverySettings.findFirst()
      dbTest.tablesAccessible.delivery_settings = deliverySettings ? '✓ Found settings' : '✓ No settings found'
    } catch (error) {
      dbTest.tablesAccessible.delivery_settings = `✗ ${error instanceof Error ? error.message : 'Error'}`
      dbTest.errorTests.push('delivery_settings table missing')
    }

    return NextResponse.json({
      success: true,
      dbTest,
      message: dbTest.errorTests.length === 0 ? 'All database checks passed' : `${dbTest.errorTests.length} expected errors found`
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}