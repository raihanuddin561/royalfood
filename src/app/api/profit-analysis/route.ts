import { NextRequest, NextResponse } from 'next/server'
import { getComprehensiveProfitAnalysis } from '@/app/actions/sales'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'today'

    let analysisParams: string | { startDate: Date | string; endDate: Date | string }

    if (startDate && endDate) {
      // Use date range if provided
      analysisParams = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    } else {
      // Use period if no date range provided
      analysisParams = period
    }

    const result = await getComprehensiveProfitAnalysis(analysisParams)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get profit analysis' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Profit analysis API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
