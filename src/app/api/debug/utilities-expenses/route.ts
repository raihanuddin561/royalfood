import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Debug endpoint to list UTILITIES expenses and show simple totals.
// Usage:
//  GET /api/debug/utilities-expenses?days=30
//  GET /api/debug/utilities-expenses?startDate=2025-08-01&endDate=2025-08-31
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const startParam = url.searchParams.get('startDate')
    const endParam = url.searchParams.get('endDate')
    const daysParam = Number(url.searchParams.get('days') || '30')

    let startDate: Date
    let endDate: Date
    if (startParam && endParam) {
      startDate = new Date(startParam)
      endDate = new Date(endParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      endDate = new Date()
      startDate = new Date()
      startDate.setDate(endDate.getDate() - Math.max(1, daysParam))
      startDate.setHours(0, 0, 0, 0)
    }

    // Fetch recent utilities expenses (including status & category info)
    const rows = await prisma.$queryRaw`
      SELECT e.id, e.amount, e.status, e."expenseDate", e.description, e.notes,
             ec.id as category_id, ec.name as category_name, ec.type as category_type
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e."expenseDate" >= ${startDate}
        AND e."expenseDate" <= ${endDate}
        AND ec.type = 'UTILITIES'
      ORDER BY e."expenseDate" DESC
      LIMIT 1000
    ` as Array<any>

    // Totals used by reports: note the reports only include APPROVED/PAID
    const totalsForReports = await prisma.$queryRaw`
      SELECT
        COALESCE(SUM(CASE WHEN ec.type = 'UTILITIES' AND e.status IN ('APPROVED','PAID') THEN e.amount ELSE 0 END), 0)::FLOAT as utilities_total_approved,
        COALESCE(COUNT(CASE WHEN ec.type = 'UTILITIES' AND e.status IN ('APPROVED','PAID') THEN 1 END), 0)::INT as utilities_count_approved,
        COALESCE(SUM(CASE WHEN e.status IN ('APPROVED','PAID') THEN e.amount ELSE 0 END), 0)::FLOAT as total_expenses_approved,
        COALESCE(COUNT(CASE WHEN e.status IN ('APPROVED','PAID') THEN 1 END), 0)::INT as total_expenses_count_approved
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e."expenseDate" >= ${startDate}
        AND e."expenseDate" <= ${endDate}
    ` as Array<any>

    const totals = totalsForReports[0] || { utilities_total_approved: 0, utilities_count_approved: 0, total_expenses_approved: 0, total_expenses_count_approved: 0 }

    return NextResponse.json({
      success: true,
      queriedRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      note: 'Reports only include expenses with status IN (\'APPROVED\', \'PAID\'). If your expense is missing, check its category type, status, and expenseDate in this output.',
      rows,
      totals
    })
  } catch (error) {
    console.error('Utilities debug endpoint error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
