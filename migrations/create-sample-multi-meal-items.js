#!/usr/bin/env node

/**
 * Test Script: Create Sample Multi-Meal Items
 * 
 * Creates sample menu items with multiple meal types to demonstrate
 * the new functionality and test the system end-to-end.
 */

const { PrismaClient } = require('@prisma/client')

async function createSampleMultiMealItems() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🍽️  Creating sample multi-meal type items...\n')

    // Get a category ID to use
    const category = await prisma.category.findFirst({
      where: { name: 'Beverages' }
    })

    if (!category) {
      console.log('❌ No Beverages category found. Creating one...')
      const newCategory = await prisma.category.create({
        data: {
          name: 'Beverages',
          description: 'Drinks and beverages'
        }
      })
      console.log(`✅ Created category: ${newCategory.name}`)
    }

    const categoryId = category?.id || (await prisma.category.findFirst({ where: { name: 'Beverages' } }))?.id

    // Sample items with multiple meal types
    const sampleItems = [
      {
        name: 'Fresh Coffee',
        description: 'Freshly brewed coffee, perfect for breakfast and afternoon breaks',
        price: 150,
        costPrice: 50,
        mealTypes: ['BREAKFAST', 'LUNCH'], // Available for both breakfast and lunch
        categoryId,
        prepTime: 5
      },
      {
        name: 'Pancakes with Syrup',
        description: 'Fluffy pancakes with maple syrup, a breakfast classic',
        price: 350,
        costPrice: 120,
        mealTypes: ['BREAKFAST'], // Breakfast only
        categoryId,
        prepTime: 15
      },
      {
        name: 'Grilled Sandwich',
        description: 'Toasted sandwich with cheese and vegetables, great for lunch and dinner',
        price: 250,
        costPrice: 80,
        mealTypes: ['LUNCH', 'DINNER'], // Lunch and dinner
        categoryId,
        prepTime: 10
      },
      {
        name: 'All-Day Pizza Slice',
        description: 'Delicious pizza slice available throughout the day',
        price: 400,
        costPrice: 150,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'], // All meal types
        categoryId,
        prepTime: 8
      }
    ]

    console.log('📝 Creating sample items...\n')

    for (const item of sampleItems) {
      // Check if item already exists
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name }
      })

      if (existing) {
        console.log(`⚠️  Item "${item.name}" already exists, skipping...`)
        continue
      }

      const created = await prisma.menuItem.create({
        data: item,
        include: {
          category: { select: { name: true } }
        }
      })

      console.log(`✅ Created: ${created.name}`)
      console.log(`   Category: ${created.category.name}`)
      console.log(`   Meal Types: ${JSON.stringify(created.mealTypes)}`)
      console.log(`   Price: BDT ${created.price}`)
      console.log('')
    }

    // Verify creation
    console.log('🔍 Verifying sample items...\n')
    
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE 'BREAKFAST' = ANY("mealTypes")) as breakfast_items,
        COUNT(*) FILTER (WHERE 'LUNCH' = ANY("mealTypes")) as lunch_items,
        COUNT(*) FILTER (WHERE 'DINNER' = ANY("mealTypes")) as dinner_items,
        COUNT(*) FILTER (WHERE array_length("mealTypes", 1) > 1) as multi_meal_items
      FROM "public"."menu_items"
      WHERE "isActive" = true
    `

    const result = stats[0]
    console.log('📊 Updated Statistics:')
    console.log(`   Total Active Items: ${result.total_items}`)
    console.log(`   🌅 Breakfast Items: ${result.breakfast_items}`)
    console.log(`   🌞 Lunch Items: ${result.lunch_items}`)
    console.log(`   🌙 Dinner Items: ${result.dinner_items}`)
    console.log(`   🍽️  Multi-Meal Items: ${result.multi_meal_items}`)
    console.log('')

    // Show some multi-meal items
    const multiMealItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        // This is a raw condition to check array length > 1
      },
      select: {
        name: true,
        mealTypes: true,
        price: true
      }
    })

    const actualMultiMeal = multiMealItems.filter(item => item.mealTypes.length > 1)
    
    if (actualMultiMeal.length > 0) {
      console.log('🍽️  Items with Multiple Meal Types:')
      actualMultiMeal.forEach(item => {
        console.log(`   • ${item.name}: ${JSON.stringify(item.mealTypes)} - BDT ${item.price}`)
      })
      console.log('')
    }

    console.log('✅ Sample multi-meal items created successfully!')
    console.log('\n🚀 Test the functionality:')
    console.log('   1. Visit http://localhost:3000/public/order')
    console.log('   2. Try changing meal types (Breakfast/Lunch/Dinner)')
    console.log('   3. See how menu items filter based on availability')
    console.log('   4. Try adding incompatible items to cart')
    console.log('   5. Check admin panel at http://localhost:3000/menu')

  } catch (error) {
    console.error('❌ Error creating sample items:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleMultiMealItems()