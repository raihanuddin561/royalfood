import { NextRequest, NextResponse } from 'next/server'
import { generateBalanceSheet } from '@/app/actions/sales'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const asOfDate = dateParam ? new Date(dateParam) : new Date()

    const result = await generateBalanceSheet(asOfDate)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate balance sheet' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Balance sheet API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
