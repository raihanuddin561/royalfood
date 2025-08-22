import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Royal Food database seeding...')

  // Create Partners
  const partner1 = await prisma.partner.upsert({
    where: { email: 'partnera@royalfood.com' },
    update: {},
    create: {
      name: 'Partner A',
      sharePercent: 60.0,
      email: 'partnera@royalfood.com',
      phone: '+8801234567890',
      address: 'Dhaka, Bangladesh'
    }
  })

  const partner2 = await prisma.partner.upsert({
    where: { email: 'partnerb@royalfood.com' },
    update: {},
    create: {
      name: 'Partner B', 
      sharePercent: 40.0,
      email: 'partnerb@royalfood.com',
      phone: '+8801234567891',
      address: 'Dhaka, Bangladesh'
    }
  })

  console.log('✅ Partners created')

  // Create Admin User Only
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@royalfood.com' },
    update: {
      password: await bcrypt.hash('11food22', 12),
      isActive: true
    },
    create: {
      email: 'admin@royalfood.com',
      password: await bcrypt.hash('11food22', 12),
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ Admin user created with secure password')

  // Create Admin Employee Profile
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeId: 'RF001',
      position: 'System Administrator',
      department: 'Administration',
      salary: 100000,
      hireDate: new Date('2024-01-01')
    }
  })

  console.log('✅ Admin employee profile created')

  // Create Categories
  const appetizers = await prisma.category.upsert({
    where: { name: 'Appetizers' },
    update: {},
    create: {
      name: 'Appetizers',
      description: 'Starters and small plates'
    }
  })

  const mainCourse = await prisma.category.upsert({
    where: { name: 'Main Course' },
    update: {},
    create: {
      name: 'Main Course',
      description: 'Main dishes and entrees'
    }
  })

  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: {
      name: 'Beverages',
      description: 'Drinks and beverages'
    }
  })

  const desserts = await prisma.category.upsert({
    where: { name: 'Desserts' },
    update: {},
    create: {
      name: 'Desserts',
      description: 'Sweet treats and desserts'
    }
  })

  const ingredients = await prisma.category.upsert({
    where: { name: 'Ingredients' },
    update: {},
    create: {
      name: 'Ingredients',
      description: 'Raw materials and ingredients'
    }
  })

  console.log('✅ Categories created')

  // Create Suppliers
  let supplier1 = await prisma.supplier.findFirst({
    where: { email: 'info@freshfoods.com.bd' }
  })
  
  if (!supplier1) {
    supplier1 = await prisma.supplier.create({
      data: {
        name: 'Fresh Foods Ltd.',
        contactName: 'Mohammad Rahman',
        email: 'info@freshfoods.com.bd',
        phone: '+8802123456789',
        address: 'Karwan Bazar, Dhaka'
      }
    })
  }

  let supplier2 = await prisma.supplier.findFirst({
    where: { email: 'orders@qualitymeats.bd' }
  })
  
  if (!supplier2) {
    supplier2 = await prisma.supplier.create({
      data: {
        name: 'Quality Meats & Fish',
        contactName: 'Ahmed Hassan',
        email: 'orders@qualitymeats.bd',
        phone: '+8802987654321',
        address: 'Gulshan, Dhaka'
      }
    })
  }

  console.log('✅ Suppliers created')

  // Create Inventory Items
  const rice = await prisma.item.upsert({
    where: { sku: 'ING001' },
    update: {},
    create: {
      name: 'Basmati Rice',
      categoryId: ingredients.id,
      supplierId: supplier1.id,
      sku: 'ING001',
      description: 'Premium basmati rice',
      unit: 'kg',
      costPrice: 120,
      reorderLevel: 10,
      currentStock: 25
    }
  })

  const chicken = await prisma.item.upsert({
    where: { sku: 'ING002' },
    update: {},
    create: {
      name: 'Chicken Breast',
      categoryId: ingredients.id,
      supplierId: supplier2.id,
      sku: 'ING002',
      description: 'Fresh chicken breast',
      unit: 'kg',
      costPrice: 280,
      reorderLevel: 5,
      currentStock: 8
    }
  })

  const tomatoes = await prisma.item.upsert({
    where: { sku: 'ING003' },
    update: {},
    create: {
      name: 'Fresh Tomatoes',
      categoryId: ingredients.id,
      supplierId: supplier1.id,
      sku: 'ING003',
      description: 'Fresh tomatoes',
      unit: 'kg',
      costPrice: 60,
      reorderLevel: 3,
      currentStock: 2
    }
  })

  const oil = await prisma.item.upsert({
    where: { sku: 'ING004' },
    update: {},
    create: {
      name: 'Cooking Oil',
      categoryId: ingredients.id,
      supplierId: supplier1.id,
      sku: 'ING004',
      description: 'Refined cooking oil',
      unit: 'L',
      costPrice: 180,
      reorderLevel: 2,
      currentStock: 1
    }
  })

  console.log('✅ Inventory items created')

  // Create Menu Items
  const chickenBiryani = await prisma.menuItem.create({
    data: {
      name: 'Chicken Biryani',
      categoryId: mainCourse.id,
      description: 'Traditional Bengali chicken biryani with fragrant basmati rice',
      price: 450,
      costPrice: 180,
      prepTime: 45
    }
  })

  const mixedSalad = await prisma.menuItem.create({
    data: {
      name: 'Mixed Salad',
      categoryId: appetizers.id,
      description: 'Fresh mixed vegetables with house dressing',
      price: 150,
      costPrice: 45,
      prepTime: 10
    }
  })

  const mangoJuice = await prisma.menuItem.create({
    data: {
      name: 'Fresh Mango Juice',
      categoryId: beverages.id,
      description: 'Freshly squeezed mango juice',
      price: 120,
      costPrice: 35,
      prepTime: 5
    }
  })

  const kheer = await prisma.menuItem.create({
    data: {
      name: 'Rice Kheer',
      categoryId: desserts.id,
      description: 'Traditional rice pudding with milk and cardamom',
      price: 180,
      costPrice: 60,
      prepTime: 20
    }
  })

  console.log('✅ Sample data created')

  // Skip complex order/sales creation to avoid conflicts
  console.log('📦 Skipping sample orders and sales for clean database')

  console.log('🎉 Royal Food database seeding completed successfully!')
  console.log('\n📋 Admin Login Credentials:')
  console.log('🔑 Admin Access: admin@royalfood.com / 11food22')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
