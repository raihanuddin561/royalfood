import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, categoryId, description, price, prepTime, isAvailable, ingredients } = body

    if (!name || !categoryId || !price) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      )
    }

    // Calculate cost price from ingredients
    const costPrice = ingredients?.reduce((total: number, ingredient: any) => 
      total + (ingredient.cost * ingredient.quantity), 0) || 0

    // Create the menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        categoryId,
        description: description || '',
        price: parseFloat(price),
        costPrice,
        prepTime: prepTime ? parseInt(prepTime) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      }
    })

    // Create recipe ingredients if provided
    if (ingredients && ingredients.length > 0) {
      const recipeItems = ingredients.map((ingredient: any) => ({
        menuItemId: menuItem.id,
        itemId: ingredient.id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        cost: ingredient.cost * ingredient.quantity
      }))

      await prisma.recipeItem.createMany({
        data: recipeItems
      })
    }

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
