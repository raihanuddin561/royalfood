import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/api-protection'
import { recordDailySalaryExpenses } from '@/app/actions/expenses'

// POST /api/attendance/mark
// Body: { startDate: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', employeeIds?: string[] }
export const POST = requireManager(async (req: Request) => {
  try {
    const body = await req.json()
    const startDateStr = body.startDate
    const endDateStr = body.endDate || body.startDate
    const employeeIds: string[] | undefined = body.employeeIds

    if (!startDateStr) return NextResponse.json({ success: false, message: 'startDate is required' }, { status: 400 })

    const parseDate = (s: string) => { const d = new Date(s); d.setHours(0,0,0,0); return d }
    let start = parseDate(startDateStr)
    let end = parseDate(endDateStr)
    if (start.getTime() > end.getTime()) { const t = start; start = end; end = t }

    // build list of dates in range
    const dates: Date[] = []
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      dates.push(new Date(dt))
    }

    // fetch employees to mark
    let employees = [] as Array<{ id: string }>
    if (employeeIds && employeeIds.length > 0) {
      employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true } })
    } else {
      employees = await prisma.employee.findMany({ where: { isActive: true }, select: { id: true } })
    }

    if (employees.length === 0) return NextResponse.json({ success: false, message: 'No employees found to mark' }, { status: 404 })

    const created: Array<{ employeeId: string; date: string }> = []

    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        for (const emp of employees) {
          // upsert attendance for employee/date: if exists, leave totalHours if provided; default to standard full-day (8h)
          const existing = await tx.attendance.findFirst({ where: { employeeId: emp.id, date: { gte: date, lte: (() => { const d = new Date(date); d.setHours(23,59,59,999); return d })() } } })
          if (!existing) {
            await tx.attendance.create({ data: { employeeId: emp.id, date: date, totalHours: 8 } })
            created.push({ employeeId: emp.id, date: date.toISOString().slice(0,10) })
          }
        }

        // For each date, call salary recording respecting attendance
        // Use the real function to create/update payroll and expenses
        await recordDailySalaryExpenses(new Date(date), { respectAttendance: true, useHoursProration: false })
      }
    })

    return NextResponse.json({ success: true, createdCount: created.length, created })
  } catch (error) {
    console.error('Attendance mark error:', error)
    return NextResponse.json({ success: false, message: 'Failed to mark attendance' }, { status: 500 })
  }
})
