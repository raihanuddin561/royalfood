#!/usr/bin/env node
/**
 * Simple reconciliation script for inventory stock.
 * Run with: node scripts/reconcile_stock.js
 * It prints items where computed stock differs from items.currentStock.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function run() {
  try {
    const sql = `
      SELECT i.id, i.name, i."currentStock" AS "currentStock", 
        COALESCE(si.sum,0) AS stock_in,
        COALESCE(so.sum,0) AS stock_out,
        COALESCE(adj.sum,0) AS adjustments,
        COALESCE(wst.sum,0) AS waste,
        COALESCE(su.sum,0) AS stock_usage,
        (COALESCE(si.sum,0) - COALESCE(so.sum,0) + COALESCE(adj.sum,0) - COALESCE(wst.sum,0) - COALESCE(su.sum,0)) AS computed_stock
      FROM items i
      LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='STOCK_IN' GROUP BY "itemId") si ON si."itemId" = i.id
      LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='STOCK_OUT' GROUP BY "itemId") so ON so."itemId" = i.id
      LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='ADJUSTMENT' GROUP BY "itemId") adj ON adj."itemId" = i.id
      LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='WASTE' GROUP BY "itemId") wst ON wst."itemId" = i.id
      LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM stock_usage GROUP BY "itemId") su ON su."itemId" = i.id
      ORDER BY i.name;
    `

    // Note: using $queryRawUnsafe since the SQL string is static and controlled here.
    const rows = await prisma.$queryRawUnsafe(sql)

    const diffs = rows.map(r => {
      const current = Number(r.currentstock ?? r.currentStock ?? r.current_stock ?? 0)
      const computed = Number(r.computed_stock ?? r.computedStock ?? r.computed_stock ?? 0)
      return {
        id: r.id,
        name: r.name,
        currentStock: current,
        computedStock: computed,
        diff: Number(current - computed)
      }
    }).filter(r => Math.abs(r.diff) > 0.0001)

    if (diffs.length === 0) {
      console.log('No mismatches found. All items reconciled.')
    } else {
      console.log(`Found ${diffs.length} mismatched items:`)
      diffs.forEach(d => console.log(`${d.name} (${d.id}) current=${d.currentStock} computed=${d.computedStock} diff=${d.diff}`))
    }
  } catch (e) {
    console.error('Reconciliation failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

run()
