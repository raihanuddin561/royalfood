import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/api-protection'

// GET /api/attendance/report?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&employeeId=...
export const GET = requireManager(async (req) => {
  try {
    const url = new URL(req.url)
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const employeeId = url.searchParams.get('employeeId')

    const where: any = {}
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        const d = new Date(dateFrom); d.setHours(0,0,0,0); where.date.gte = d
      }
      if (dateTo) {
        const d = new Date(dateTo); d.setHours(23,59,59,999); where.date.lte = d
      }
    }
    if (employeeId) where.employeeId = employeeId

    const rows = await prisma.attendance.findMany({ where, include: { employee: { include: { user: true } } }, orderBy: { date: 'desc' }, take: 1000 })

    const report = rows.map(r => ({ id: r.id, employeeId: r.employeeId, name: r.employee.user.name, date: r.date.toISOString().slice(0,10), totalHours: r.totalHours }))

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Attendance report error', error)
    return NextResponse.json({ success: false, message: 'Failed to generate attendance report' }, { status: 500 })
  }
})
