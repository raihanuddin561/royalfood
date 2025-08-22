import { NextRequest, NextResponse } from 'next/server'
import { getEmployees } from '@/app/actions/employees'

export async function GET(request: NextRequest) {
  try {
    const employees = await getEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}
