import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // require ADMIN or MANAGER
    try {
      await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
    } catch (err: any) {
      console.error('Reconcile GET auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const rows = await prisma.$queryRaw`
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

  const rowsArr = rows as any[]
  const diffs = rowsArr.map((r: any) => {
      const current = Number(r.currentStock ?? r.currentstock ?? 0)
      const computed = Number(r.computed_stock ?? r.computedStock ?? 0)
      return {
        id: r.id,
        name: r.name,
        currentStock: current,
        computedStock: computed,
        diff: Number(current - computed)
      }
  }).filter((r: any) => Math.abs(r.diff) > 0.0001)

    return NextResponse.json({ success: true, count: diffs.length, diffs })
  } catch (error) {
    console.error('Reconcile API error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  } finally {
    // no-op
  }
}

export async function POST(request: NextRequest) {
  try {
    // require ADMIN only
    try {
      await validateApiRequest(request, [UserRole.ADMIN])
    } catch (err: any) {
      console.error('Reconcile POST auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const itemIds: string[] = Array.isArray(body?.itemIds) ? body.itemIds : []

    if (itemIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No itemIds provided' }, { status: 400 })
    }

    // Find an admin user to attribute logs
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'No ADMIN user found in database. Cannot create audit logs.' }, { status: 500 })
    }

    const updates: { id: string; computed: number }[] = []

    // Compute per-item computed_stock
    for (const id of itemIds) {
      const rows: any[] = await prisma.$queryRaw`
        SELECT i.id, i.name, i."currentStock" AS "currentStock",
          (COALESCE(si.sum,0) - COALESCE(so.sum,0) + COALESCE(adj.sum,0) - COALESCE(wst.sum,0) - COALESCE(su.sum,0)) AS computed_stock
        FROM items i
        LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='STOCK_IN' GROUP BY "itemId") si ON si."itemId" = i.id
        LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='STOCK_OUT' GROUP BY "itemId") so ON so."itemId" = i.id
        LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='ADJUSTMENT' GROUP BY "itemId") adj ON adj."itemId" = i.id
        LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM inventory_logs WHERE type='WASTE' GROUP BY "itemId") wst ON wst."itemId" = i.id
        LEFT JOIN (SELECT "itemId", SUM(quantity) AS sum FROM stock_usage GROUP BY "itemId") su ON su."itemId" = i.id
        WHERE i.id = ${id}
      `
      if (rows.length === 0) continue
      const r = rows[0]
      const computed = Number(r.computed_stock ?? r.computedStock ?? 0)
      updates.push({ id: r.id, computed })
    }

    const applied: { id: string; previous: number; next: number }[] = []

    await prisma.$transaction(async (tx) => {
      for (const u of updates) {
        const prev = await tx.item.findUnique({ where: { id: u.id }, select: { currentStock: true } })
        const previousStock = prev?.currentStock ?? 0
        await tx.item.update({ where: { id: u.id }, data: { currentStock: u.computed } })
        await tx.inventoryLog.create({
          data: {
            itemId: u.id,
            userId: adminUser.id,
            type: 'ADJUSTMENT',
            quantity: Number(u.computed - previousStock),
            previousStock,
            newStock: u.computed,
            reason: 'Reconciliation adjustment (automated)'
          }
        })
        applied.push({ id: u.id, previous: previousStock, next: u.computed })
      }
    })

    return NextResponse.json({ success: true, applied })
  } catch (error) {
    console.error('Reconcile apply error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
