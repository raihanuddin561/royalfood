import { NextRequest, NextResponse } from 'next/server'
import { recordDailySalaryExpenses } from '@/app/actions/expenses'

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

    const result = await recordDailySalaryExpenses(new Date(date))

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

export async function GET(request: NextRequest) {
  try {
    // Record salary expenses for today
    const today = new Date()
    const result = await recordDailySalaryExpenses(today)

    return NextResponse.json({
      success: true,
      message: `Daily salary expenses check completed for ${today.toISOString().split('T')[0]}`,
      result
    })
  } catch (error) {
    console.error('Error in salary expenses check:', error)
    return NextResponse.json(
      { error: 'Failed to check salary expenses' },
      { status: 500 }
    )
  }
}
