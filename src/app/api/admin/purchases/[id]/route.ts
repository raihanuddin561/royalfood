import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
  } catch (err: any) {
    console.error('Purchase get auth error:', err)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        purchaseItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, purchase })
  } catch (error) {
    console.error('Get purchase error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
  } catch (err: any) {
    console.error('Purchase update auth error:', err)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { supplierId, purchaseDate, lines } = body

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one purchase line is required' }, { status: 400 })
    }

    // Validate that all required fields are present
    for (const line of lines) {
      if (!line.itemId || !line.quantity || line.quantity <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid line item data' }, { status: 400 })
      }
    }

    // Find an admin user to attribute logs
    const adminUser = await prisma.user.findFirst({ 
      where: { role: 'ADMIN' }, 
      select: { id: true } 
    })
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'No ADMIN user found' }, { status: 500 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the current purchase to check if it's already received
      const currentPurchase = await tx.purchase.findUnique({
        where: { id: params.id },
        include: {
          purchaseItems: {
            include: {
              item: true
            }
          }
        }
      })

      if (!currentPurchase) {
        throw new Error('Purchase not found')
      }

      // If purchase is already received, we need to handle stock adjustments
      const isReceived = currentPurchase.status === 'RECEIVED'
      
      if (isReceived) {
        // For received purchases, we need to reverse the old stock impact and apply the new one
        
        // First, reverse the old stock changes
        for (const oldItem of currentPurchase.purchaseItems) {
          const item = await tx.item.findUnique({
            where: { id: oldItem.itemId },
            select: { currentStock: true, costPrice: true }
          })
          
          if (item) {
            const currentStock = Number(item.currentStock)
            const currentCost = Number(item.costPrice)
            const oldReceivedQty = Number(oldItem.receivedQuantity)
            const oldUnitPrice = Number(oldItem.unitPrice)
            
            // Calculate what the stock and cost would be without this purchase
            const newStock = Math.max(0, currentStock - oldReceivedQty)
            
            // Recalculate cost price without this purchase
            let newCost = 0
            if (newStock > 0 && currentStock > oldReceivedQty) {
              // Calculate the remaining value after removing this purchase
              const totalValue = currentStock * currentCost
              const purchaseValue = oldReceivedQty * oldUnitPrice
              const remainingValue = totalValue - purchaseValue
              newCost = remainingValue / newStock
            }

            await tx.item.update({
              where: { id: oldItem.itemId },
              data: {
                currentStock: newStock,
                costPrice: newCost,
                updatedAt: new Date()
              }
            })

            // Log the stock reduction
            await tx.inventoryLog.create({
              data: {
                itemId: oldItem.itemId,
                userId: adminUser.id,
                type: 'STOCK_OUT',
                quantity: oldReceivedQty,
                previousStock: currentStock,
                newStock: newStock,
                reason: `Purchase update reversal: ${currentPurchase.purchaseNumber}`,
                reference: currentPurchase.id,
                createdAt: new Date()
              }
            })
          }
        }
      }

      // Delete old purchase items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: params.id }
      })

      // Create new purchase items
      let totalAmount = 0
      for (const line of lines) {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice || 0)
        totalAmount += lineTotal

        await tx.purchaseItem.create({
          data: {
            purchaseId: params.id,
            itemId: line.itemId,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice || 0),
            totalPrice: lineTotal,
            receivedQuantity: isReceived ? Number(line.quantity) : 0
          }
        })
      }

      // Update the purchase
      const updateData: any = {
        totalAmount,
        updatedAt: new Date()
      }

      if (supplierId !== undefined) {
        updateData.supplierId = supplierId || null
      }

      if (purchaseDate) {
        updateData.purchaseDate = new Date(purchaseDate)
      }

      const updatedPurchase = await tx.purchase.update({
        where: { id: params.id },
        data: updateData
      })

      // If the purchase was received, apply the new stock changes
      if (isReceived) {
        for (const line of lines) {
          const item = await tx.item.findUnique({
            where: { id: line.itemId },
            select: { currentStock: true, costPrice: true }
          })
          
          if (item) {
            const prevStock = Number(item.currentStock)
            const prevCost = Number(item.costPrice)
            const receivedQty = Number(line.quantity)
            const unitPrice = Number(line.unitPrice || 0)
            
            const newStock = prevStock + receivedQty
            const newCost = (prevStock * prevCost + receivedQty * unitPrice) / (newStock || 1)

            const updatedItem = await tx.item.update({
              where: { id: line.itemId },
              data: {
                currentStock: newStock,
                costPrice: newCost,
                updatedAt: new Date()
              },
              select: { currentStock: true }
            })

            // Log the stock addition
            await tx.inventoryLog.create({
              data: {
                itemId: line.itemId,
                userId: adminUser.id,
                type: 'STOCK_IN',
                quantity: receivedQty,
                previousStock: prevStock,
                newStock: updatedItem.currentStock,
                reason: `Purchase updated: ${currentPurchase.purchaseNumber}`,
                reference: params.id,
                createdAt: new Date()
              }
            })
          }
        }
      }

      return updatedPurchase
    })

    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${params.id}`)
    revalidatePath('/inventory')

    return NextResponse.json({ success: true, purchase: result })
  } catch (error) {
    console.error('Update purchase error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await validateApiRequest(request, [UserRole.ADMIN])
  } catch (err: any) {
    console.error('Purchase delete auth error:', err)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find an admin user to attribute logs
    const adminUser = await prisma.user.findFirst({ 
      where: { role: 'ADMIN' }, 
      select: { id: true } 
    })
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'No ADMIN user found' }, { status: 500 })
    }

    await prisma.$transaction(async (tx) => {
      // Get the current purchase to check if it's received
      const currentPurchase = await tx.purchase.findUnique({
        where: { id: params.id },
        include: {
          purchaseItems: {
            include: {
              item: true
            }
          }
        }
      })

      if (!currentPurchase) {
        throw new Error('Purchase not found')
      }

      // If purchase is received, we need to reverse stock changes
      if (currentPurchase.status === 'RECEIVED') {
        for (const purchaseItem of currentPurchase.purchaseItems) {
          const item = await tx.item.findUnique({
            where: { id: purchaseItem.itemId },
            select: { currentStock: true, costPrice: true }
          })
          
          if (item) {
            const currentStock = Number(item.currentStock)
            const currentCost = Number(item.costPrice)
            const receivedQty = Number(purchaseItem.receivedQuantity)
            const unitPrice = Number(purchaseItem.unitPrice)
            
            // Calculate what the stock and cost would be without this purchase
            const newStock = Math.max(0, currentStock - receivedQty)
            
            // Recalculate cost price without this purchase
            let newCost = 0
            if (newStock > 0 && currentStock > receivedQty) {
              const totalValue = currentStock * currentCost
              const purchaseValue = receivedQty * unitPrice
              const remainingValue = totalValue - purchaseValue
              newCost = remainingValue / newStock
            }

            await tx.item.update({
              where: { id: purchaseItem.itemId },
              data: {
                currentStock: newStock,
                costPrice: newCost,
                updatedAt: new Date()
              }
            })

            // Log the stock reduction
            await tx.inventoryLog.create({
              data: {
                itemId: purchaseItem.itemId,
                userId: adminUser.id,
                type: 'STOCK_OUT',
                quantity: receivedQty,
                previousStock: currentStock,
                newStock: newStock,
                reason: `Purchase deleted: ${currentPurchase.purchaseNumber}`,
                reference: currentPurchase.id,
                createdAt: new Date()
              }
            })
          }
        }
      }

      // Delete purchase items first (due to foreign key constraints)
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: params.id }
      })

      // Delete the purchase
      await tx.purchase.delete({
        where: { id: params.id }
      })
    })

    revalidatePath('/admin/purchases')
    revalidatePath('/inventory')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete purchase error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}