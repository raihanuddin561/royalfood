import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, createExpense } from '@/app/actions/expenses'
import { requireApiAuth } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Require authentication - all roles can view expenses but only Manager+ can see detailed info
    const { user, response } = await requireApiAuth(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')

    const result = await getExpenses({
      categoryId: categoryId || undefined,
      type: type as any,
      status: status as any,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: limit ? parseInt(limit) : undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require Manager or Admin role to create expenses
    const { user, response } = await requireApiAuth(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (response) return response

    const data = await request.json()
    
    // Convert date strings to Date objects
    const expenseData = {
      ...data,
      expenseDate: new Date(data.expenseDate),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined
    }

    const result = await createExpense(expenseData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
