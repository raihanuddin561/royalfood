import { NextResponse } from 'next/server'
import { getDailyCosts } from '@/app/actions/restaurant-operations'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') || ''

  try {
    const parsed = date ? new Date(date) : new Date()
    const result = await getDailyCosts(parsed)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[daily-costs] error', { date, message: err?.message })
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
