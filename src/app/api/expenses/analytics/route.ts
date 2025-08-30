import { NextRequest, NextResponse } from 'next/server'
import { getExpenseAnalytics } from '@/app/actions/expenses'
import { requireApiAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireApiAuth(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const result = await getExpenseAnalytics({ startDate: new Date(startDate), endDate: new Date(endDate) })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ analytics: result.analytics })
  } catch (error) {
    console.error('Error fetching expense analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
