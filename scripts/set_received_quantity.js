// One-off migration script: set purchase_item.receivedQuantity = quantity for already RECEIVED purchases
// Run with: node scripts/set_received_quantity.js

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Looking for purchases with status RECEIVED...')
    const purchases = await prisma.purchase.findMany({ where: { status: 'RECEIVED' }, include: { purchaseItems: true } })
    console.log(`Found ${purchases.length} received purchases`)
    let totalLines = 0
    for (const p of purchases) {
      for (const pi of p.purchaseItems) {
        totalLines++
        const prev = pi.receivedQuantity ?? 0
        if (prev >= pi.quantity) continue
        await prisma.purchaseItem.update({ where: { id: pi.id }, data: { receivedQuantity: pi.quantity, lastReceivedAt: p.updatedAt ?? new Date() } })
      }
    }
    console.log(`Processed ${totalLines} purchase items`) 
  } catch (e) {
    console.error('Migration script failed', e)
    process.exitCode = 1
  } finally {
    try { await prisma.$disconnect() } catch {}
  }
}

main()
