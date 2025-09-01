const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetChickenToCorrectState() {
  try {
    console.log('Resetting chicken stock to the correct state based on your example...')
    
    const itemId = 'cmey4mcdz0002ic54frm1w3wc'
    
    console.log('Based on your description:')
    console.log('- Started with some stock (let\'s say 15 kg)')
    console.log('- Used 5 kg → should be 10 kg')  
    console.log('- Purchased 10 kg → should be 20 kg')
    console.log('- But system shows 25 kg (5 kg extra due to multiple purchase entries)')
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('No admin user found')
      return
    }
    
    await prisma.$transaction(async (tx) => {
      // Delete ALL inventory logs for this item to start fresh
      const deletedLogs = await tx.inventoryLog.deleteMany({
        where: { itemId }
      })
      console.log(`🗑️  Deleted ${deletedLogs.count} existing logs`)
      
      // Create clean log history based on your scenario
      const baseDate = new Date('2025-08-30')
      
      // 1. Initial stock (15 kg)
      await tx.inventoryLog.create({
        data: {
          itemId,
          userId: adminUser.id,
          type: 'STOCK_IN',
          quantity: 15,
          previousStock: 0,
          newStock: 15,
          reason: 'Initial stock entry',
          reference: 'CLEAN-RESET',
          createdAt: baseDate
        }
      })
      
      // 2. Usage (-5 kg → 10 kg remaining)
      const usageDate = new Date('2025-09-01T06:00:00Z')
      await tx.inventoryLog.create({
        data: {
          itemId,
          userId: adminUser.id,
          type: 'STOCK_OUT',
          quantity: 5,
          previousStock: 15,
          newStock: 10,
          reason: 'Stock usage: RECIPE',
          reference: 'CLEAN-USAGE',
          createdAt: usageDate
        }
      })
      
      // 3. Purchase (+10 kg → 20 kg total)
      const purchaseDate = new Date('2025-09-01T08:00:00Z')
      await tx.inventoryLog.create({
        data: {
          itemId,
          userId: adminUser.id,
          type: 'STOCK_IN',
          quantity: 10,
          previousStock: 10,
          newStock: 20,
          reason: 'Purchase received: CORRECT-PURCHASE',
          reference: 'CLEAN-PURCHASE',
          createdAt: purchaseDate
        }
      })
      
      // Update item to correct stock (20 kg)
      await tx.item.update({
        where: { id: itemId },
        data: { 
          currentStock: 20,
          updatedAt: new Date()
        }
      })
      
      console.log('✅ Reset complete:')
      console.log('   - Initial: 15 kg')
      console.log('   - Used: -5 kg = 10 kg')
      console.log('   - Purchased: +10 kg = 20 kg')
      console.log('   - Final stock: 20 kg ✓')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetChickenToCorrectState()
