const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMenuData() {
  try {
    console.log('🔄 Creating menu items and categories...');

    // First, create categories
    const categories = [
      { name: 'Appetizers', description: 'Start your meal with these delicious appetizers' },
      { name: 'Main Courses', description: 'Hearty main dishes to satisfy your hunger' },
      { name: 'Desserts', description: 'Sweet treats to end your meal perfectly' },
      { name: 'Beverages', description: 'Refreshing drinks to complement your meal' },
      { name: 'Salads', description: 'Fresh and healthy salad options' }
    ];

    console.log('Creating categories...');
    const createdCategories = {};
    for (const categoryData of categories) {
      const category = await prisma.category.upsert({
        where: { name: categoryData.name },
        update: {},
        create: categoryData
      });
      createdCategories[categoryData.name] = category;
      console.log(`✓ Created category: ${category.name}`);
    }

    // Create menu items
    const menuItems = [
      // Appetizers
      {
        name: 'Chicken Wings',
        description: 'Crispy chicken wings with your choice of sauce',
        price: 12.99,
        categoryId: createdCategories['Appetizers'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 15,
        image: '/images/chicken-wings.jpg'
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Golden fried mozzarella sticks with marinara sauce',
        price: 8.99,
        categoryId: createdCategories['Appetizers'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 10,
        image: '/images/mozzarella-sticks.jpg'
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 9.99,
        categoryId: createdCategories['Salads'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 8,
        image: '/images/caesar-salad.jpg'
      },

      // Main Courses
      {
        name: 'Royal Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 15.99,
        categoryId: createdCategories['Main Courses'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 20,
        image: '/images/royal-burger.jpg'
      },
      {
        name: 'Grilled Chicken',
        description: 'Perfectly grilled chicken breast with herbs and spices',
        price: 18.99,
        categoryId: createdCategories['Main Courses'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 25,
        image: '/images/grilled-chicken.jpg'
      },
      {
        name: 'Fish & Chips',
        description: 'Beer-battered fish with crispy fries',
        price: 16.99,
        categoryId: createdCategories['Main Courses'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 18,
        image: '/images/fish-chips.jpg'
      },
      {
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon and parmesan cheese',
        price: 14.99,
        categoryId: createdCategories['Main Courses'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 15,
        image: '/images/pasta-carbonara.jpg'
      },

      // Desserts
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with chocolate ganache',
        price: 6.99,
        categoryId: createdCategories['Desserts'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 5,
        image: '/images/chocolate-cake.jpg'
      },
      {
        name: 'Ice Cream Sundae',
        description: 'Vanilla ice cream with chocolate sauce and whipped cream',
        price: 5.99,
        categoryId: createdCategories['Desserts'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 3,
        image: '/images/ice-cream-sundae.jpg'
      },

      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 4.99,
        categoryId: createdCategories['Beverages'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 2,
        image: '/images/orange-juice.jpg'
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee',
        price: 2.99,
        categoryId: createdCategories['Beverages'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 3,
        image: '/images/coffee.jpg'
      },
      {
        name: 'Soft Drink',
        description: 'Choice of cola, sprite, or orange soda',
        price: 2.49,
        categoryId: createdCategories['Beverages'].id,
        isActive: true,
        isAvailable: true,
        prepTime: 1,
        image: '/images/soft-drink.jpg'
      }
    ];

    console.log('Creating menu items...');
    let createdCount = 0;
    for (const itemData of menuItems) {
      // Check if item already exists
      const existingItem = await prisma.menuItem.findFirst({
        where: { name: itemData.name }
      });
      
      if (existingItem) {
        console.log(`⚡ Menu item already exists: ${itemData.name}`);
        continue;
      }
      
      const menuItem = await prisma.menuItem.create({
        data: itemData
      });
      createdCount++;
      console.log(`✓ Created menu item: ${menuItem.name} - $${menuItem.price}`);
    }

    console.log(`\n✅ Successfully created ${createdCount} menu items in ${Object.keys(createdCategories).length} categories!`);
    
    // Verify the data
    const totalCategories = await prisma.category.count();
    const totalMenuItems = await prisma.menuItem.count();
    const activeMenuItems = await prisma.menuItem.count({
      where: { isActive: true, isAvailable: true }
    });

    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Categories: ${totalCategories}`);
    console.log(`   Total Menu Items: ${totalMenuItems}`);
    console.log(`   Active & Available Items: ${activeMenuItems}`);

  } catch (error) {
    console.error('❌ Error creating menu data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMenuData();