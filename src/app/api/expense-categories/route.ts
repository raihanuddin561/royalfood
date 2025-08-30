import { NextRequest, NextResponse } from 'next/server'
import { getExpenseCategories, initializeExpenseCategories } from '@/app/actions/expenses'
import { requireApiAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Require auth (any role can view categories)
    const { user, response } = await requireApiAuth(request)
    if (response) return response

    // Ensure defaults exist
    await initializeExpenseCategories()

    const result = await getExpenseCategories()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.categories)
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
