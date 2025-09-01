'use server'

import { prisma } from '@/lib/prisma'

export interface StockDiscrepancy {
  itemId: string
  itemName: string
  currentStock: number
  computedStock: number
  difference: number
  logs: Array<{
    id: string
    type: string
    quantity: number
    reason: string
    createdAt: Date
    reference?: string
  }>
}

export interface StockReconciliationResult {
  success: boolean
  discrepancies: StockDiscrepancy[]
  totalItems: number
  itemsWithDiscrepancies: number
  error?: string
}

/**
 * Comprehensive stock reconciliation that computes expected stock from inventory logs
 * and compares with current stock to identify discrepancies
 */
export async function reconcileAllStock(): Promise<StockReconciliationResult> {
  try {
    // Get all active items with their inventory logs
    const items = await prisma.item.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        currentStock: true,
        unit: true
      },
      orderBy: { name: 'asc' }
    })

    const discrepancies: StockDiscrepancy[] = []

    for (const item of items) {
      // Get all inventory logs for this item ordered by creation date
      const logs = await prisma.inventoryLog.findMany({
        where: { itemId: item.id },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          quantity: true,
          reason: true,
          createdAt: true,
          reference: true
        }
      })

      // Compute expected stock from logs
      let computedStock = 0
      for (const log of logs) {
        switch (log.type) {
          case 'STOCK_IN':
            computedStock += log.quantity
            break
          case 'ADJUSTMENT':
            // Adjustments can be positive or negative - add the actual quantity
            computedStock += log.quantity
            break
          case 'STOCK_OUT':
          case 'WASTE':
            computedStock -= log.quantity
            break
          default:
            // Unknown log type, log a warning
            console.warn(`Unknown inventory log type: ${log.type}`)
            break
        }
      }

      // Check for discrepancy
      const difference = item.currentStock - computedStock
      if (Math.abs(difference) > 0.001) { // Allow for small floating point differences
        discrepancies.push({
          itemId: item.id,
          itemName: item.name,
          currentStock: item.currentStock,
          computedStock: computedStock,
          difference: difference,
          logs: logs.map(log => ({
            id: log.id,
            type: log.type,
            quantity: log.quantity,
            reason: log.reason || '',
            createdAt: log.createdAt,
            reference: log.reference || undefined
          }))
        })
      }
    }

    return {
      success: true,
      discrepancies,
      totalItems: items.length,
      itemsWithDiscrepancies: discrepancies.length
    }
  } catch (error) {
    console.error('Stock reconciliation error:', error)
    return {
      success: false,
      discrepancies: [],
      totalItems: 0,
      itemsWithDiscrepancies: 0,
      error: 'Failed to reconcile stock'
    }
  }
}

/**
 * Fix stock discrepancies by updating current stock to match computed stock
 * and creating adjustment logs
 */
export async function fixStockDiscrepancies(itemIds: string[]) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return {
        success: false,
        error: 'No admin user found for creating adjustment logs'
      }
    }

    const fixed: Array<{ itemId: string; itemName: string; oldStock: number; newStock: number; adjustment: number }> = []

    await prisma.$transaction(async (tx) => {
      for (const itemId of itemIds) {
        // Get item details
        const item = await tx.item.findUnique({
          where: { id: itemId },
          select: { id: true, name: true, currentStock: true }
        })

        if (!item) continue

        // Recompute stock from logs
        const logs = await tx.inventoryLog.findMany({
          where: { itemId: item.id },
          orderBy: { createdAt: 'asc' }
        })

        let computedStock = 0
        for (const log of logs) {
          switch (log.type) {
            case 'STOCK_IN':
              computedStock += log.quantity
              break
            case 'ADJUSTMENT':
              // Adjustments can be positive or negative - add the actual quantity
              computedStock += log.quantity
              break
            case 'STOCK_OUT':
            case 'WASTE':
              computedStock -= log.quantity
              break
          }
        }

        const adjustment = computedStock - item.currentStock
        
        if (Math.abs(adjustment) > 0.001) {
          // Update the item stock
          await tx.item.update({
            where: { id: itemId },
            data: { currentStock: computedStock }
          })

          // Create adjustment log
          await tx.inventoryLog.create({
            data: {
              itemId: itemId,
              userId: adminUser.id,
              type: 'ADJUSTMENT',
              quantity: adjustment,
              previousStock: item.currentStock,
              newStock: computedStock,
              reason: 'Stock reconciliation - fixing computed vs recorded discrepancy',
              reference: 'RECONCILIATION'
            }
          })

          fixed.push({
            itemId: item.id,
            itemName: item.name,
            oldStock: item.currentStock,
            newStock: computedStock,
            adjustment: adjustment
          })
        }
      }
    })

    return {
      success: true,
      fixed,
      message: `Fixed ${fixed.length} stock discrepancies`
    }
  } catch (error) {
    console.error('Error fixing stock discrepancies:', error)
    return {
      success: false,
      error: 'Failed to fix stock discrepancies'
    }
  }
}

/**
 * Get recent stock movements for debugging purposes
 */
export async function getRecentStockMovements(itemId?: string, limit = 50) {
  try {
    const logs = await prisma.inventoryLog.findMany({
      where: itemId ? { itemId } : undefined,
      include: {
        item: {
          select: { name: true, unit: true }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return {
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        itemName: log.item.name,
        itemUnit: log.item.unit,
        type: log.type,
        quantity: log.quantity,
        previousStock: log.previousStock,
        newStock: log.newStock,
        reason: log.reason,
        reference: log.reference,
        createdAt: log.createdAt,
        userName: log.user.name
      }))
    }
  } catch (error) {
    console.error('Error getting recent stock movements:', error)
    return {
      success: false,
      logs: [],
      error: 'Failed to get stock movements'
    }
  }
}
