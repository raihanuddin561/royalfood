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
      console.error('Low-stock GET auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const allItems = await prisma.item.findMany({
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' }
    })

    const items = allItems.filter(it => (it.currentStock ?? 0) <= (it.reorderLevel ?? 0))

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Low-stock GET error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

// Create purchase drafts grouped by supplier for provided itemIds or all low-stock items
export async function POST(request: NextRequest) {
  try {
    // require ADMIN or MANAGER
    try {
      await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
    } catch (err: any) {
      console.error('Low-stock POST auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const itemIds: string[] | undefined = Array.isArray(body?.itemIds) ? body.itemIds : undefined

  // Select low-stock items (or filtered by itemIds)
  const allItems = await prisma.item.findMany({ include: { supplier: true }, orderBy: { name: 'asc' } })
  let items = allItems.filter(it => (it.currentStock ?? 0) <= (it.reorderLevel ?? 0))
  if (itemIds) items = items.filter(it => itemIds.includes(it.id))

    // Group by supplierId (only items with supplierId)
    const bySupplier: Record<string, any[]> = {}
    const skipped: any[] = []
    for (const item of items) {
      if (!item.supplierId) {
        skipped.push(item)
        continue
      }
      if (!bySupplier[item.supplierId]) bySupplier[item.supplierId] = []
      bySupplier[item.supplierId].push(item)
    }

    const created: any[] = []

    // For each supplier, create a Purchase and PurchaseItems
    for (const supplierId of Object.keys(bySupplier)) {
      const itemsForSupplier = bySupplier[supplierId]
      const purchaseNumber = `PO-${Date.now()}-${supplierId.slice(0,6)}`
      const purchase = await prisma.purchase.create({
        data: {
          supplierId,
          purchaseNumber,
          purchaseDate: new Date(),
          totalAmount: 0,
          status: 'PENDING'
        }
      })

      let total = 0
      const piData = itemsForSupplier.map(it => {
        // Suggest quantity = max(1, reorderLevel*1 - currentStock)
        const qty = Math.max(1, Math.ceil((it.reorderLevel || 0) - (it.currentStock || 0)))
        const unitPrice = it.costPrice || 0
        total += qty * unitPrice
        return {
          purchaseId: purchase.id,
          itemId: it.id,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: qty * unitPrice
        }
      })

      if (piData.length > 0) {
        await prisma.purchaseItem.createMany({ data: piData })
        // Update purchase total
        await prisma.purchase.update({ where: { id: purchase.id }, data: { totalAmount: total } })
      }

      created.push({ purchaseId: purchase.id, supplierId, count: piData.length })
    }

    return NextResponse.json({ success: true, created, skipped })
  } catch (error) {
    console.error('Low-stock POST error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
