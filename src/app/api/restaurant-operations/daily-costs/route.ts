import { NextRequest, NextResponse } from 'next/server'
import { getDailyCosts } from '@/app/actions/restaurant-operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const result = await getDailyCosts(date)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Daily costs API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
