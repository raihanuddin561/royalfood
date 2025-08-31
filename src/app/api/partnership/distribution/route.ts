import { NextResponse } from 'next/server'
import { generateBalanceSheet, getComprehensiveProfitAnalysis } from '@/app/actions/sales'
import { getPartnershipDistribution } from '@/app/actions/partnership'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const startParam = url.searchParams.get('startDate')
    const endParam = url.searchParams.get('endDate')

    // If a date range was provided, compute distributable amount for that range
    if (startParam && endParam) {
      const start = new Date(startParam)
      const end = new Date(endParam)
      const analysis = await getComprehensiveProfitAnalysis({ startDate: start, endDate: end })
      if (!analysis || !analysis.success || !analysis.summary) {
        return NextResponse.json({ success: false, error: 'Failed to compute distribution for range' }, { status: 500 })
      }

      // Use net profit (totalNetProfit) for distribution over the range
      const distributable = analysis.summary.totalNetProfit || 0
      const dist = await getPartnershipDistribution(distributable)
      return NextResponse.json({ success: true, data: dist })
    }

    // Fallback: single as-of date (backwards-compatible)
    const dateParam = url.searchParams.get('date')
    const asOf = dateParam ? new Date(dateParam) : new Date()
    const resp = await generateBalanceSheet(asOf)
    if (!resp || !resp.success || !resp.balanceSheet) {
      return NextResponse.json({ success: false, error: 'Failed to compute distribution' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: resp.balanceSheet.partnershipDistribution })
  } catch (error) {
    console.error('GET /api/partnership/distribution error', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch distribution' }, { status: 500 })
  }
}
