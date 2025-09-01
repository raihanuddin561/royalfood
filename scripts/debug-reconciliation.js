const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugReconciliation() {
  try {
    console.log('Debugging exact reconciliation logic...')
    
    const itemId = 'cmey4mcdz0002ic54frm1w3wc'
    
    // Get current item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { name: true, currentStock: true }
    })
    
    console.log(`Item: ${item.name}`)
    console.log(`Current Stock: ${item.currentStock}`)
    
    // Get all logs in order
    const logs = await prisma.inventoryLog.findMany({
      where: { itemId },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`\nAll ${logs.length} inventory logs:`)
    
    let runningTotal = 0
    for (const log of logs) {
      const before = runningTotal
      
      switch (log.type) {
        case 'STOCK_IN':
        case 'ADJUSTMENT':
          runningTotal += log.quantity
          break
        case 'STOCK_OUT':
        case 'WASTE':
          runningTotal -= log.quantity
          break
      }
      
      console.log(`${log.createdAt.toISOString().slice(0, 19)} | ${log.type.padEnd(11)} | ${log.quantity.toString().padStart(8)} | ${before.toFixed(2).padStart(8)} → ${runningTotal.toFixed(2).padStart(8)} | ${log.reason}`)
    }
    
    console.log(`\nFinal computed: ${runningTotal}`)
    console.log(`Current stock:  ${item.currentStock}`)
    console.log(`Difference:     ${item.currentStock - runningTotal}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugReconciliation()
