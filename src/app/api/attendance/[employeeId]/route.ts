import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee, requireManager } from '@/lib/api-protection'

// GET - allowed for managers/admins for any employee; employees only for their own record
export const GET = requireEmployee(async (req, { params }) => {
  try {
    const employeeId = params.employeeId
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    if (!dateParam) return NextResponse.json({ success: false, message: 'Missing date' }, { status: 400 })

    const date = new Date(dateParam)
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    // If user is EMPLOYEE, ensure they can only access their own employee record
    if (req.user.role === 'EMPLOYEE') {
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id } })
      if (!emp || emp.id !== employeeId) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
      }
    }

    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, date: { gte: start, lte: end } }
    })

    return NextResponse.json({ success: true, attendance })
  } catch (error) {
    console.error('Attendance GET error', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch attendance' }, { status: 500 })
  }
})

// POST - only managers/admins can create/update attendance
export const POST = requireManager(async (req, { params }) => {
  try {
    const employeeId = params.employeeId
    const body = await req.json()
    const { date: dateParam, totalHours } = body
    if (!dateParam) return NextResponse.json({ success: false, message: 'Missing date' }, { status: 400 })

    const date = new Date(dateParam)
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const existing = await prisma.attendance.findFirst({ where: { employeeId, date: { gte: start, lte: end } } })

    let attendance
    if (existing) {
      attendance = await prisma.attendance.update({ where: { id: existing.id }, data: { totalHours: totalHours === null ? null : Number(totalHours) } })
    } else {
      attendance = await prisma.attendance.create({ data: { employeeId, date: start, totalHours: totalHours === null ? null : Number(totalHours) } })
    }

    return NextResponse.json({ success: true, attendance })
  } catch (error) {
    console.error('Attendance POST error', error)
    return NextResponse.json({ success: false, message: 'Failed to save attendance' }, { status: 500 })
  }
})
