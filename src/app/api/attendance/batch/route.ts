import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/api-protection'

// POST /api/attendance/batch
// Body: { date: string, employeeIds: string[], mode?: 'present'|'hours'|'absent', hours?: number }
export const POST = requireManager(async (req) => {
  try {
    const body = await req.json()
    const { date: dateParam, employeeIds, mode = 'present', hours } = body

    if (!dateParam) return NextResponse.json({ success: false, message: 'Missing date' }, { status: 400 })
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) return NextResponse.json({ success: false, message: 'No employees selected' }, { status: 400 })

    const date = new Date(dateParam)
    const start = new Date(date)
    start.setHours(0,0,0,0)
    const end = new Date(date)
    end.setHours(23,59,59,999)

    // Load employees to read standardHoursPerDay and validate ids
    const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, include: { user: true } })
    const empMap = employees.reduce((acc, e) => { acc[e.id] = e; return acc }, {} as Record<string, any>)

    const results: Array<{ employeeId: string, name: string, created: boolean, hours: number | null }> = []

    await prisma.$transaction(async (tx) => {
      for (const id of employeeIds) {
        const emp = empMap[id]
        if (!emp) continue

        // Determine hours to set
        let totalHours: number | null = null
        if (mode === 'absent') {
          totalHours = null
        } else if (mode === 'hours') {
          totalHours = typeof hours === 'number' ? hours : emp.standardHoursPerDay || 8
        } else {
          // present: use provided hours or employee standard hours
          totalHours = typeof hours === 'number' ? hours : emp.standardHoursPerDay || 8
        }

        const existing = await tx.attendance.findFirst({ where: { employeeId: id, date: { gte: start, lte: end } } })
        if (existing) {
          const updated = await tx.attendance.update({ where: { id: existing.id }, data: { totalHours: totalHours === null ? null : Number(totalHours) } })
          results.push({ employeeId: id, name: emp.user.name, created: false, hours: updated.totalHours ?? null })
        } else {
          const created = await tx.attendance.create({ data: { employeeId: id, date: start, totalHours: totalHours === null ? null : Number(totalHours) } })
          results.push({ employeeId: id, name: emp.user.name, created: true, hours: created.totalHours ?? null })
        }
      }
    })

    return NextResponse.json({ success: true, summary: results, total: results.length })
  } catch (error) {
    console.error('Batch attendance error', error)
    return NextResponse.json({ success: false, message: 'Failed to save batch attendance' }, { status: 500 })
  }
})
