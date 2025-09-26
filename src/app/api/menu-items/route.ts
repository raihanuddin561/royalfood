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
  console.log('🚀 [MENU_ITEM_CREATE] Starting menu item creation request')
  
  try {
    console.log('📄 [MENU_ITEM_CREATE] Parsing request body...')
    const body = await request.json()
    const { name, categoryId, description, price, deliveryCharge, prepTime, image, mealTypes, isAvailable, ingredients } = body

    console.log('📋 [MENU_ITEM_CREATE] Request data:', {
      name,
      categoryId,
      description: description ? 'provided' : 'empty',
      price,
      deliveryCharge,
      prepTime,
      image: image ? 'provided' : 'empty',
      isAvailable,
      ingredientsCount: ingredients?.length || 0
    })

    // Basic validation
    if (!name || !categoryId || !price) {
      console.error('❌ [MENU_ITEM_CREATE] Missing required fields:', { name: !!name, categoryId: !!categoryId, price: !!price })
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      )
    }

    // Validate meal types
    if (!mealTypes || !Array.isArray(mealTypes) || mealTypes.length === 0) {
      console.error('❌ [MENU_ITEM_CREATE] Invalid meal types:', mealTypes)
      return NextResponse.json(
        { error: 'At least one meal type must be selected' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    console.log('🔍 [MENU_ITEM_CREATE] Checking for duplicate names...')
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    if (existingItem) {
      console.warn(`⚠️ [MENU_ITEM_CREATE] Duplicate name found: "${name}" already exists with ID: ${existingItem.id}`)
      return NextResponse.json(
        { 
          error: 'Menu item with this name already exists',
          duplicate: true,
          existingId: existingItem.id 
        },
        { status: 409 }
      )
    }
    console.log('✅ [MENU_ITEM_CREATE] No duplicate names found')

    // Calculate cost price from ingredients
    console.log('💰 [MENU_ITEM_CREATE] Calculating cost price...')
    const costPrice = ingredients?.reduce((total: number, ingredient: any) => 
      total + (ingredient.cost * ingredient.quantity), 0) || 0
    console.log(`💰 [MENU_ITEM_CREATE] Calculated cost price: ${costPrice}`)

    // Create the menu item
    console.log('💾 [MENU_ITEM_CREATE] Creating menu item in database...')
    const menuItemData = {
      name: name.trim(),
      categoryId,
      description: description?.trim() || '',
      price: parseFloat(price),
      deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
      costPrice,
      prepTime: prepTime ? parseInt(prepTime) : null,
      image: image || null,
      mealTypes: mealTypes && mealTypes.length > 0 ? mealTypes : ['LUNCH'],
      isAvailable: isAvailable !== undefined ? isAvailable : true
    }

    console.log('📊 [MENU_ITEM_CREATE] Menu item data to create:', menuItemData)

    const menuItem = await prisma.menuItem.create({
      data: menuItemData
    })

    console.log(`✅ [MENU_ITEM_CREATE] Menu item created successfully with ID: ${menuItem.id}`)

    // Create recipe ingredients if provided
    if (ingredients && ingredients.length > 0) {
      console.log(`🧾 [MENU_ITEM_CREATE] Creating ${ingredients.length} recipe ingredients...`)
      
      const recipeItems = ingredients.map((ingredient: any, index: number) => {
        console.log(`📝 [MENU_ITEM_CREATE] Recipe item ${index + 1}:`, {
          menuItemId: menuItem.id,
          itemId: ingredient.id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          totalCost: ingredient.cost * ingredient.quantity
        })
        
        return {
          menuItemId: menuItem.id,
          itemId: ingredient.id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost * ingredient.quantity
        }
      })

      await prisma.recipeItem.createMany({
        data: recipeItems
      })
      console.log(`✅ [MENU_ITEM_CREATE] ${recipeItems.length} recipe items created successfully`)
    } else {
      console.log('📝 [MENU_ITEM_CREATE] No ingredients provided, skipping recipe creation')
    }

    console.log('🎉 [MENU_ITEM_CREATE] Menu item creation completed successfully')
    return NextResponse.json(menuItem, { status: 201 })
    
  } catch (error) {
    console.error('💥 [MENU_ITEM_CREATE] Error creating menu item:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to create menu item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
