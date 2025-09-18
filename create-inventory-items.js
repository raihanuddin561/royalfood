const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleInventoryItems() {
  try {
    console.log('Creating sample inventory items for stock adjustment testing...')
    
    // First, get or create a category
    let category = await prisma.category.findFirst()
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Raw Materials',
          description: 'Basic cooking ingredients'
        }
      })
      console.log('✅ Created category:', category.name)
    }
    
    // Create sample inventory items (ingredients)
    const sampleItems = [
      {
        name: 'Basmati Rice',
        sku: 'RICE-001',
        unit: 'kg',
        currentStock: 50.0,
        costPrice: 120.00,
        categoryId: category.id,
        isActive: true,
        specification: 'Premium quality basmati rice'
      },
      {
        name: 'Chicken Breast',
        sku: 'CHICKEN-001', 
        unit: 'kg',
        currentStock: 25.0,
        costPrice: 450.00,
        categoryId: category.id,
        isActive: true,
        specification: 'Fresh chicken breast'
      },
      {
        name: 'Onions',
        sku: 'ONION-001',
        unit: 'kg',
        currentStock: 30.0,
        costPrice: 80.00,
        categoryId: category.id,
        isActive: true,
        specification: 'Fresh red onions'
      },
      {
        name: 'Cooking Oil',
        sku: 'OIL-001',
        unit: 'liter',
        currentStock: 15.0,
        costPrice: 200.00,
        categoryId: category.id,
        isActive: true,
        specification: 'Sunflower cooking oil'
      },
      {
        name: 'Spice Mix',
        sku: 'SPICE-001',
        unit: 'kg',
        currentStock: 5.0,
        costPrice: 800.00,
        categoryId: category.id,
        isActive: true,
        specification: 'Biriyani spice blend'
      }
    ]
    
    for (const item of sampleItems) {
      const created = await prisma.item.create({
        data: item
      })
      console.log('✅ Created inventory item:', created.name, '(' + created.currentStock + ' ' + created.unit + ')')
    }
    
    console.log('\n🎉 Sample inventory items created successfully!')
    console.log('You can now test stock adjustments at: http://localhost:3000/inventory/adjustment')
    
    // Verify creation
    const totalItems = await prisma.item.count()
    console.log('\nTotal inventory items now:', totalItems)
    
  } catch (error) {
    console.error('❌ Failed to create inventory items:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleInventoryItems()