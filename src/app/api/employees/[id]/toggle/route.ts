import { NextRequest, NextResponse } from 'next/server'
import { toggleEmployeeStatus } from '@/app/actions/employees'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await toggleEmployeeStatus(params.id)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        employee: result.employee,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error toggling employee status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
