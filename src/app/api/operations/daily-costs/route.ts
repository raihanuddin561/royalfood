import { NextResponse } from 'next/server'
import { getDailyCosts } from '@/app/actions/restaurant-operations'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') || ''

  try {
    // Parse 'YYYY-MM-DD' without timezone shifts. If parsing fails, fall back to Date.
    const parseDateOnly = (v: string | null) => {
      if (!v) return null
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!m) return null
      const y = Number(m[1])
      const mo = Number(m[2]) - 1
      const d = Number(m[3])
      return new Date(y, mo, d)
    }

    const parsed = date ? (parseDateOnly(date) || new Date(date)) : new Date()

    // Log parsing for diagnostics (visible in server logs)
    try {
      const s = new Date(parsed)
      s.setHours(0, 0, 0, 0)
      const e = new Date(parsed)
      e.setHours(23, 59, 59, 999)
      console.log('[daily-costs] request', { dateParam: date, parsed: parsed.toISOString(), start: s.toISOString(), end: e.toISOString() })
    } catch (e) {
      /* ignore logging errors */
    }

    const result = await getDailyCosts(parsed)

    // Add lightweight diagnostic counts for the requested day to help debug empty results
    try {
      const start = new Date(parsed)
      start.setHours(0, 0, 0, 0)
      const end = new Date(parsed)
      end.setHours(23, 59, 59, 999)

      const [salesCount, stockUsageCount, expensesCount] = await Promise.all([
        prisma.sale.count({ where: { saleDate: { gte: start, lte: end } } }),
        prisma.stockUsage.count({ where: { usageDate: { gte: start, lte: end } } }),
        prisma.expense.count({ where: { expenseDate: { gte: start, lte: end }, status: 'APPROVED' } })
      ])

      console.log('[daily-costs] counts', { date: parsed.toISOString().split('T')[0], salesCount, stockUsageCount, expensesCount })
      // Attach debug counts to result for client inspection
      ;(result as any)._debug = { salesCount, stockUsageCount, expensesCount }
    } catch (e) {
      console.error('[daily-costs] debug counts failed', e)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[daily-costs] error', { date, message: err?.message })
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
