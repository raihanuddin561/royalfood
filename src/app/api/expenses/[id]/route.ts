import { NextRequest, NextResponse } from 'next/server'
import { getExpenseById, updateExpense, deleteExpense } from '@/app/actions/expenses'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const result = await getExpenseById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Expense not found' ? 404 : 500 }
      )
    }

    return NextResponse.json(result.expense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    // Convert date strings to Date objects
    const updateData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined
    }

    const result = await updateExpense(id, updateData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.expense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const result = await deleteExpense(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
