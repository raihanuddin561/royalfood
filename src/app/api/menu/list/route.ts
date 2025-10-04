import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      items: menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category?.name || 'Uncategorized',
        mealTypes: Array.isArray(item.mealTypes) ? item.mealTypes : ['LUNCH'], // Ensure it's always an array
        prepTime: item.prepTime,
        isAvailable: item.isAvailable
      }))
    })

  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch menu items'
    }, { status: 500 })
  }
}
