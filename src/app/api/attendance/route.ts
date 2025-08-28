import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/api-protection'

export const GET = requireEmployee(async (req) => {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    const date = dateParam ? new Date(dateParam) : new Date()
    const start = new Date(date)
    start.setHours(0,0,0,0)
    const end = new Date(date)
    end.setHours(23,59,59,999)

    // If employee role, return only their record
    if (req.user.role === 'EMPLOYEE') {
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id }, include: { user: true, attendance: { where: { date: { gte: start, lte: end } }, take: 30 } } })
      if (!emp) return NextResponse.json({ success: true, data: [] })

      const data = [{
        id: emp.id,
        name: emp.user.name,
        employeeId: emp.employeeId,
        position: emp.position,
        department: emp.department,
        salary: emp.salary,
        hourlyRate: emp.hourlyRate,
        isActive: emp.isActive,
        attendance: emp.attendance.length ? { totalHours: emp.attendance[0].totalHours } : undefined
      }]

      return NextResponse.json({ success: true, data })
    }

    // Manager/Admin: return all active employees with attendance for the date
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { user: true, attendance: { where: { date: { gte: start, lte: end } }, take: 1 } },
      orderBy: { position: 'asc' }
    })

    const data = employees.map(e => ({
      id: e.id,
      name: e.user.name,
      employeeId: e.employeeId,
      position: e.position,
      department: e.department,
      salary: e.salary,
      hourlyRate: e.hourlyRate,
      isActive: e.isActive,
      attendance: e.attendance[0] ? { totalHours: e.attendance[0].totalHours } : undefined
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Attendance list error', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch attendance' }, { status: 500 })
  }
})
