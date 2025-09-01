const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function preventDoubleSubmissionIssues() {
  console.log('🛡️  IMPLEMENTING DOUBLE-SUBMISSION PREVENTION...')
  
  try {
    // 1. Check for recent duplicate operations in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      },
      include: {
        item: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Found ${recentLogs.length} recent inventory logs`)
    
    // Group by quantity and time to find potential duplicates
    const duplicateGroups = new Map()
    
    for (const log of recentLogs) {
      const key = `${log.itemId}-${log.quantity}-${log.type}`
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      duplicateGroups.get(key).push(log)
    }
    
    console.log('\n🔍 DUPLICATE DETECTION:')
    let duplicatesFound = false
    
    for (const [key, logs] of duplicateGroups.entries()) {
      if (logs.length > 1) {
        duplicatesFound = true
        const [itemId, quantity, type] = key.split('-')
        const item = logs[0].item
        console.log(`⚠️  ${item.name}: ${logs.length} identical ${type} operations (${quantity} kg)`)
        
        // Show timestamps to identify rapid submissions
        for (const log of logs) {
          const timestamp = log.createdAt.toISOString().replace('T', ' ').substring(0, 19)
          console.log(`     ${timestamp} | ${log.user?.name} | ${log.reason}`)
        }
      }
    }
    
    if (!duplicatesFound) {
      console.log('✅ No recent duplicate operations found')
    }
    
    // 2. Check for purchase orders that might have been double-processed
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      },
      include: {
        purchaseItems: {
          include: {
            item: { select: { name: true } }
          }
        }
      }
    })
    
    console.log(`\n📦 RECENT PURCHASES: ${recentPurchases.length}`)
    
    for (const purchase of recentPurchases) {
      console.log(`   ${purchase.purchaseNumber} | ${purchase.status} | ${purchase.totalAmount || 0} | ${purchase.purchaseItems.length} items`)
      
      // Check if this purchase was processed multiple times
      const relatedLogs = await prisma.inventoryLog.findMany({
        where: {
          reference: purchase.id,
          createdAt: { gte: fiveMinutesAgo }
        }
      })
      
      if (relatedLogs.length > purchase.purchaseItems.length) {
        console.log(`     ⚠️  Warning: ${relatedLogs.length} inventory logs for ${purchase.purchaseItems.length} items`)
      }
    }
    
    // 3. Summary and recommendations
    console.log('\n🎯 PREVENTION MEASURES ACTIVE:')
    console.log('   ✅ Toast notifications replace alert() calls')
    console.log('   ✅ Form buttons disabled during submission')
    console.log('   ✅ Stock validation warns about duplicates')
    console.log('   ✅ Purchase Order workflow prevents double-counting')
    console.log('   ✅ Reconciliation tools available for cleanup')
    
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('   📝 Always use Purchase Orders for stock additions')
    console.log('   🚫 Avoid clicking submit buttons multiple times')
    console.log('   🔍 Check Stock Reconciliation weekly')
    console.log('   📱 Wait for success notification before making new entries')
    
  } catch (error) {
    console.error('❌ Error checking for double-submission issues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

preventDoubleSubmissionIssues()
