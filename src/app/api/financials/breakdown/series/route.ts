import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeExpenseBreakdownSeries } from '@/app/actions/financial-breakdown'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const startParam = url.searchParams.get('startDate')
    const endParam = url.searchParams.get('endDate')

    if (!startParam || !endParam) {
      return NextResponse.json({ success: false, error: 'startDate and endDate are required' }, { status: 400 })
    }

    const startDate = new Date(startParam)
    const endDate = new Date(endParam)

    const series = await computeExpenseBreakdownSeries(prisma as any, startDate, endDate)

    return NextResponse.json({ success: true, data: series })
  } catch (error) {
    console.error('GET /api/financials/breakdown/series error', error)
    return NextResponse.json({ success: false, error: 'Failed to compute series' }, { status: 500 })
  }
}
