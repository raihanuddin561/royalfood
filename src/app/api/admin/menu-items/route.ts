import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Ensure mealTypes is always an array
    const safeMenuItems = menuItems.map(item => ({
      ...item,
      mealTypes: Array.isArray(item.mealTypes) ? item.mealTypes : ['LUNCH']
    }))

    return NextResponse.json(safeMenuItems)
  } catch (error) {
    console.error('Error fetching admin menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}