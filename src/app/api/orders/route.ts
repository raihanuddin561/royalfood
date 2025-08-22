import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrdersWithStats } from '@/app/actions/orders'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const result = await createOrder(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')

    const result = await getOrdersWithStats({
      page,
      limit,
      filters: {
        ...(status && { status }),
        ...(orderType && { orderType })
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      orders: result.orders,
      stats: result.stats,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
