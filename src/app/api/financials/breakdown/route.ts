import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import computeExpenseBreakdown from '@/app/actions/financial-breakdown'

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

    const breakdown = await computeExpenseBreakdown(prisma as any, startDate, endDate)

    return NextResponse.json({ success: true, data: breakdown })
  } catch (error) {
    console.error('GET /api/financials/breakdown error', error)
    return NextResponse.json({ success: false, error: 'Failed to compute breakdown' }, { status: 500 })
  }
}
