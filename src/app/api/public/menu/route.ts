import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/menu - Public menu for customers (no auth required)
export async function GET() {
  try {
    const [menuItems, categories] = await Promise.all([
      // Get active and available menu items with categories
      prisma.menuItem.findMany({
        where: {
          isActive: true,
          isAvailable: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          prepTime: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { category: { name: 'asc' } },
          { name: 'asc' }
        ]
      }),
      
      // Get active categories that have available menu items
      prisma.category.findMany({
        where: {
          isActive: true,
          menuItems: {
            some: {
              isActive: true,
              isAvailable: true
            }
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ])

    // Group menu items by category
    const menuByCategory = categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.categoryId === category.id)
    })).filter(category => category.items.length > 0)

    return NextResponse.json({
      success: true,
      categories: menuByCategory,
      totalItems: menuItems.length,
      totalCategories: categories.length
    })

  } catch (error) {
    console.error('Public menu fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch menu items'
    }, { status: 500 })
  }
}
