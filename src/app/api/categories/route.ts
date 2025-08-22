import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee, requireManager, type AuthenticatedRequest } from '@/lib/api-protection'

// GET /api/categories - Get all categories (All authenticated users)
async function getCategoriesHandler(request: AuthenticatedRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category (Manager+ only)
async function createCategoryHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name
      }
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        eventType: 'CATEGORY_CREATED',
        description: `Category "${name}" created by ${request.user.email}`,
        userId: request.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// Apply authentication protection
export const GET = requireEmployee(getCategoriesHandler)
export const POST = requireManager(createCategoryHandler)
