import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createPurchaseExpense } from '@/app/actions/expenses'

export async function POST(request: NextRequest) {
  try {
    try {
      await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
    } catch (err: any) {
      console.error('Purchase create (internal) auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const purchaseDate = body?.purchaseDate ? new Date(body.purchaseDate) : new Date()
    const lines: Array<{ itemId: string; quantity: number; unitPrice?: number }> = Array.isArray(body?.lines) ? body.lines : []
    const receiveImmediately: boolean = body?.receiveImmediately === true

  // supplierId may be omitted (optional)

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
    if (!adminUser) return NextResponse.json({ success: false, error: 'No ADMIN user found' }, { status: 500 })

  const supplierId: string | null = body?.supplierId ?? null

    let purchaseId: string | null = null

    await prisma.$transaction(async (tx) => {
  const purchaseData: any = { purchaseDate, purchaseNumber: `PO-${Date.now()}`, status: receiveImmediately ? 'RECEIVED' : 'PENDING', totalAmount: 0 }
      if (supplierId) purchaseData.supplierId = supplierId
  const purchase = await tx.purchase.create({ data: purchaseData })
      purchaseId = purchase.id

      for (const l of lines) {
        await tx.purchaseItem.create({ data: { purchaseId: purchase.id, itemId: l.itemId, quantity: l.quantity, unitPrice: l.unitPrice ?? 0, receivedQuantity: receiveImmediately ? l.quantity : 0, totalPrice: l.quantity * (l.unitPrice ?? 0) } })
      }

      if (receiveImmediately) {
        const purchaseItems = await tx.purchaseItem.findMany({ where: { purchaseId: purchase.id } })
        let totalAmount = 0
        for (const pi of purchaseItems) {
          const item = await tx.item.findUnique({ where: { id: pi.itemId }, select: { currentStock: true, costPrice: true } })
          const prevStock = Number(item?.currentStock ?? 0)
          const prevCost = Number(item?.costPrice ?? 0)
          const receivedQty = Number(pi.receivedQuantity ?? 0)
          const unitPrice = Number(pi.unitPrice ?? 0)
          const newStock = prevStock + receivedQty
          const newCost = (prevStock * prevCost + receivedQty * unitPrice) / (newStock || 1)

          await tx.item.update({ where: { id: pi.itemId }, data: { currentStock: { increment: receivedQty }, costPrice: newCost, updatedAt: new Date() } })

          await tx.inventoryLog.create({ data: { itemId: pi.itemId, userId: adminUser.id, type: 'STOCK_IN', quantity: receivedQty, previousStock: prevStock, newStock, reason: `Purchase received: ${purchase.purchaseNumber}`, reference: purchase.id, createdAt: new Date() } })

          totalAmount += Number(pi.totalPrice ?? 0)
        }

        await tx.purchase.update({ where: { id: purchase.id }, data: { totalAmount, status: 'RECEIVED', updatedAt: new Date() } })
      } else {
        const createdItems = await tx.purchaseItem.findMany({ where: { purchaseId: purchase.id } })
        const totalAmount = createdItems.reduce((s, it) => s + Number(it.totalPrice ?? 0), 0)
        await tx.purchase.update({ where: { id: purchase.id }, data: { totalAmount, updatedAt: new Date() } })
      }
    })

    try { if (purchaseId) await createPurchaseExpense(purchaseId) } catch (e) { console.warn('Failed to create purchase expense automatically:', e) }

    revalidatePath('/inventory')
    revalidatePath('/admin/low-stock')

    return NextResponse.json({ success: true, purchaseId })
  } catch (error) {
    console.error('Create purchase (internal) error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
