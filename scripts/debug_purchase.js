#!/usr/bin/env node
/*
  Usage:
    node scripts/debug_purchase.js --purchaseId <id>
    node scripts/debug_purchase.js --itemId <id>
    node scripts/debug_purchase.js --recent

  This script uses the Prisma client to fetch:
    - purchase + purchaseItems + related inventory logs (by purchaseId)
    - item + recent inventory logs (by itemId)
    - or recent purchases & recent inventory logs when --recent is used

  Run it from the repo root where node and environment (DATABASE_URL_NEW) are available.
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function argv(name) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

async function main() {
  const purchaseId = argv('purchaseId')
  const itemId = argv('itemId')
  const recent = process.argv.includes('--recent')

  if (purchaseId) {
    const p = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { purchaseItems: true, supplier: true } })
    console.log('Purchase:', p)
    if (p) {
      const logs = await prisma.inventoryLog.findMany({ where: { reference: purchaseId }, orderBy: { createdAt: 'desc' } })
      console.log(`Inventory logs referencing purchase ${purchaseId}:`, logs)
      for (const pi of p.purchaseItems) {
        const item = await prisma.item.findUnique({ where: { id: pi.itemId } })
        console.log('PurchaseItem:', pi, 'Current item row:', item)
      }
    }
    process.exit(0)
  }

  if (itemId) {
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    console.log('Item:', item)
    const logs = await prisma.inventoryLog.findMany({ where: { itemId }, orderBy: { createdAt: 'desc' }, take: 50 })
    console.log(`Recent inventory logs for item ${itemId}:`) 
    logs.forEach(l => console.log(l))
    process.exit(0)
  }

  if (recent) {
    const purchases = await prisma.purchase.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
    console.log('Recent purchases:')
    console.log(purchases)
    const logs = await prisma.inventoryLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    console.log('Recent inventory logs:')
    console.log(logs)
    process.exit(0)
  }

  console.error('Please pass --purchaseId <id> or --itemId <id> or --recent')
  process.exit(2)
}

main().catch(e => { console.error(e); process.exit(1) })
