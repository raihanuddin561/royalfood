// Simple script to check database status
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...')
    
    // Check orders
    const orderCount = await prisma.order.count()
    console.log(`Orders: ${orderCount}`)
    
    // Check menu items  
    const menuCount = await prisma.menuItem.count()
    console.log(`Menu items: ${menuCount}`)
    
    // Check for pre-orders
    const preOrderCount = await prisma.order.count({ where: { isPreOrder: true } })
    console.log(`Pre-orders: ${preOrderCount}`)
    
    if (orderCount === 0) {
      console.log('❌ No orders found - cart functionality likely not connected to database')
    }
    
  } catch (error) {
    console.error('Database error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()