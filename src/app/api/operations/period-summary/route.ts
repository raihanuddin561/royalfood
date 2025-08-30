import { NextResponse } from 'next/server'
import { getPeriodSummary } from '@/app/actions/restaurant-operations'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const start = url.searchParams.get('start') || ''
  const end = url.searchParams.get('end') || ''

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const startedAt = Date.now()
  console.log('[period-summary] start', { requestId, start, end })

  try {
    const result = await getPeriodSummary(start, end)

    const durationMs = Date.now() - startedAt
    let dailyCount: number | undefined = undefined
    try { dailyCount = Array.isArray((result as any)?.summary?.dailyBreakdown) ? (result as any).summary.dailyBreakdown.length : undefined } catch (e) { /* ignore */ }

    console.log('[period-summary] success', { requestId, start, end, durationMs, dailyCount })
    return NextResponse.json(result)
  } catch (err: any) {
    const durationMs = Date.now() - startedAt
    console.error('[period-summary] error', { requestId, start, end, durationMs, message: err?.message, stack: err?.stack })
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
