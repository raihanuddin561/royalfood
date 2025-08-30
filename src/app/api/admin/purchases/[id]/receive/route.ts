import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createPurchaseExpense } from '@/app/actions/expenses'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require ADMIN or MANAGER
    try {
      await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
    } catch (err: any) {
      console.error('Purchase receive auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const purchaseId = params.id
    if (!purchaseId) return NextResponse.json({ success: false, error: 'Missing purchase id' }, { status: 400 })

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { purchaseItems: true } })
    if (!purchase) return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })

    if (purchase.status === 'RECEIVED') {
      return NextResponse.json({ success: false, error: 'Purchase already received' }, { status: 400 })
    }

    // Read request body for per-line receive details
    // expected body: { lines?: [{ purchaseItemId, receivedQuantity?, unitPrice? }] }
    const body = await request.json().catch(() => ({}))
    const lines: Array<{ purchaseItemId: string; receivedQuantity?: number; unitPrice?: number }> = Array.isArray(body?.lines) ? body.lines : []

  // Use transaction: update item stocks and create inventory logs, update unit prices and purchase totals, then mark purchase RECEIVED when fully received
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
    if (!adminUser) return NextResponse.json({ success: false, error: 'No ADMIN user found to attribute logs' }, { status: 500 })
    const appliedLines: Array<{ purchaseItemId: string; itemId: string; received: number; unitPrice: number }> = []

    await prisma.$transaction(async (tx) => {
      // Fetch fresh purchase items inside transaction
      const purchaseItems = await tx.purchaseItem.findMany({ where: { purchaseId: purchase.id } })

      let totalAmount = 0
      let anyReceived = false
      let allLinesComplete = true

      for (const pi of purchaseItems) {
        const override = lines.find(l => l.purchaseItemId === pi.id)
        // amount left to receive for this line
        const prevReceived = Number(pi.receivedQuantity ?? 0)
        const orderedQty = Number(pi.quantity ?? 0)
        const remaining = Math.max(0, orderedQty - prevReceived)

        const requestedReceive = typeof override?.receivedQuantity === 'number' ? Number(override.receivedQuantity) : remaining
        const receiveQty = Math.min(remaining, Math.max(0, requestedReceive))
        const unitPrice = typeof override?.unitPrice === 'number' ? Number(override.unitPrice) : Number(pi.unitPrice || 0)

        if (receiveQty <= 0) {
          if (remaining > 0) allLinesComplete = false
          // still add previous line total to overall purchase total
          totalAmount += Number(pi.totalPrice || 0)
          continue
        }

        anyReceived = true
        if (receiveQty < remaining) allLinesComplete = false

        // Update item stock and cost using weighted average
        const item = await tx.item.findUnique({ where: { id: pi.itemId }, select: { currentStock: true, costPrice: true } })
        const prevStock = Number(item?.currentStock ?? 0)
        const prevCost = Number(item?.costPrice ?? 0)
        const receivedQty = receiveQty

        const newStock = prevStock + receivedQty

        // Weighted average cost: (prevStock*prevCost + receivedQty*unitPrice) / (prevStock + receivedQty)
        const newCost = (prevStock * prevCost + receivedQty * unitPrice) / (newStock || 1)

  await tx.item.update({ where: { id: pi.itemId }, data: { currentStock: { increment: receivedQty }, costPrice: newCost, updatedAt: new Date() } })

        // Update purchase item: increase receivedQuantity, set lastReceivedAt, update unitPrice if provided, recompute totalPrice based on ordered quantity and latest unitPrice
        const newReceivedQuantity = prevReceived + receivedQty
        const updateData: any = { receivedQuantity: newReceivedQuantity, lastReceivedAt: new Date() }
        if (typeof override?.unitPrice === 'number') {
          updateData.unitPrice = unitPrice
        }
        // keep totalPrice as orderedQty * unitPrice (use latest unitPrice)
        updateData.totalPrice = orderedQty * (updateData.unitPrice ?? pi.unitPrice)

        await tx.purchaseItem.update({ where: { id: pi.id }, data: updateData })

        // Create inventory log for the received quantity
        await tx.inventoryLog.create({
          data: {
            itemId: pi.itemId,
            userId: adminUser.id,
            type: 'STOCK_IN',
            quantity: receivedQty,
            previousStock: prevStock,
            newStock: newStock,
            reason: `Purchase received: ${purchase.purchaseNumber}`,
            reference: purchase.id,
            createdAt: new Date()
          }
        })

        appliedLines.push({ purchaseItemId: pi.id, itemId: pi.itemId, received: receivedQty, unitPrice })

        // accumulate purchase total using the (ordered qty × effective unit price) for this line
        totalAmount += orderedQty * (updateData.unitPrice ?? pi.unitPrice)
      }

      // Determine new purchase status
      let newStatus: any = purchase.status
      if (allLinesComplete && anyReceived) newStatus = 'RECEIVED'
      else if (!allLinesComplete && anyReceived) newStatus = 'PARTIALLY_RECEIVED'

      await tx.purchase.update({ where: { id: purchase.id }, data: { status: newStatus as any, totalAmount, updatedAt: new Date() } })
    })

    // Optionally create linked expense record (inventory purchase)
    try {
      await createPurchaseExpense(purchase.id)
    } catch (e) {
      console.warn('Failed to create purchase expense automatically:', e)
    }

    // Revalidate relevant pages
    revalidatePath('/inventory')
    revalidatePath('/admin/low-stock')

    return NextResponse.json({ success: true, purchaseId: purchase.id })
  } catch (error) {
    console.error('Receive purchase error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
