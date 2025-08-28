import { NextRequest, NextResponse } from 'next/server'
import { recordDailySalaryExpenses } from '@/app/actions/expenses'

// GET /api/record-salary-expenses?date=YYYY-MM-DD&respectAttendance=true&useHoursProration=true&standardHoursPerDay=8
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    const respectAttendance = url.searchParams.get('respectAttendance') === 'true'
    const useHoursProration = url.searchParams.get('useHoursProration') === 'true'
    const standardHoursPerDay = Number(url.searchParams.get('standardHoursPerDay') || '8')

    const date = dateParam ? new Date(dateParam) : new Date()

    const result = await recordDailySalaryExpenses(date, { respectAttendance, useHoursProration, standardHoursPerDay })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Record salary expenses route error', error)
    return NextResponse.json({ success: false, message: 'Failed to record salary expenses' }, { status: 500 })
  }
}

// POST /api/record-salary-expenses with JSON body { date, respectAttendance, useHoursProration, standardHoursPerDay }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const { respectAttendance, useHoursProration, standardHoursPerDay } = body
    const opts: any = {}
    if (respectAttendance !== undefined) opts.respectAttendance = Boolean(respectAttendance)
    if (useHoursProration !== undefined) opts.useHoursProration = Boolean(useHoursProration)
    if (standardHoursPerDay !== undefined) opts.standardHoursPerDay = Number(standardHoursPerDay)

    const result = await recordDailySalaryExpenses(new Date(date), opts)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          totalAmount: result.totalAmount,
          employeeCount: result.employeeCount
        }
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error recording salary expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
