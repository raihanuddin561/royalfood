import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        recipeItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
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
    const body = await request.json()
    const { name, categoryId, description, price, prepTime, isAvailable, ingredients } = body

    if (!name || !categoryId || !price) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      )
    }

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Calculate cost price from ingredients
    const costPrice = ingredients?.reduce((total: number, ingredient: any) => 
      total + (ingredient.cost * ingredient.quantity), 0) || 0

    // Use transaction to update menu item and ingredients
    const result = await prisma.$transaction(async (tx) => {
      // Update the menu item
      const updatedMenuItem = await tx.menuItem.update({
        where: { id },
        data: {
          name,
          categoryId,
          description: description || '',
          price: parseFloat(price),
          costPrice,
          prepTime: prepTime ? parseInt(prepTime) : null,
          isAvailable: isAvailable !== undefined ? isAvailable : true
        },
        include: {
          category: true
        }
      })

      // Delete existing recipe items
      await tx.recipeItem.deleteMany({
        where: { menuItemId: id }
      })

      // Create new recipe items if provided
      if (ingredients && ingredients.length > 0) {
        const recipeItems = ingredients.map((ingredient: any) => ({
          menuItemId: id,
          itemId: ingredient.id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost * ingredient.quantity
        }))

        await tx.recipeItem.createMany({
          data: recipeItems
        })
      }

      return updatedMenuItem
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
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

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Use transaction to delete menu item and related data
    await prisma.$transaction(async (tx) => {
      // Delete recipe items first
      await tx.recipeItem.deleteMany({
        where: { menuItemId: id }
      })

      // Soft delete the menu item by setting isActive to false
      await tx.menuItem.update({
        where: { id },
        data: { isActive: false }
      })
    })

    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
