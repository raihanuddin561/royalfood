import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface StockValidationResult {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
}

/**
 * Validate stock operations to prevent double-counting and inconsistencies
 */
export async function validateStockOperation(
  itemId: string, 
  operation: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT',
  quantity: number,
  timeWindow: number = 5 * 60 * 1000 // 5 minutes
): Promise<StockValidationResult> {
  
  const result: StockValidationResult = {
    isValid: true,
    warnings: [],
    recommendations: []
  }
  
  // Check for recent similar operations
  const recentLogs = await prisma.inventoryLog.findMany({
    where: {
      itemId,
      createdAt: {
        gte: new Date(Date.now() - timeWindow)
      }
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  if (operation === 'PURCHASE') {
    // Check for multiple purchase logs with same quantity
    const recentPurchases = recentLogs.filter(log => 
      log.type === 'STOCK_IN' && 
      Math.abs(log.quantity - quantity) < 0.01 &&
      log.reason?.includes('Purchase')
    )
    
    if (recentPurchases.length > 0) {
      result.warnings.push(
        `⚠️  Found ${recentPurchases.length} recent purchase(s) with similar quantity (${quantity}kg) in the last ${timeWindow / 60000} minutes`
      )
      result.recommendations.push(
        '🔍 Check if this purchase was already recorded through Purchase Orders'
      )
      result.recommendations.push(
        '📝 Use Purchase Order workflow instead of direct inventory addition'
      )
    }
  }
  
  if (operation === 'USAGE') {
    // Check current stock is sufficient
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { currentStock: true, name: true, unit: true }
    })
    
    if (!item) {
      result.isValid = false
      result.warnings.push('❌ Item not found')
      return result
    }
    
    if (item.currentStock < quantity) {
      result.warnings.push(
        `⚠️  Insufficient stock: trying to use ${quantity}${item.unit} but only ${item.currentStock}${item.unit} available`
      )
    }
  }
  
  if (operation === 'ADJUSTMENT') {
    result.recommendations.push(
      '📝 Document the reason for this adjustment in the system'
    )
  }
  
  // General recommendations for clean operations
  result.recommendations.push(
    '✅ Best Practice: Use Purchase Orders for all purchases to maintain proper audit trail'
  )
  
  return result
}

/**
 * Get suggested stock operation workflow
 */
export function getStockWorkflowGuidance(operation: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT'): string[] {
  
  const guidance = {
    PURCHASE: [
      '1. Create Purchase Order first',
      '2. Receive items through Purchase Order',
      '3. Stock will be updated automatically',
      '❌ Avoid: Direct inventory addition for purchases'
    ],
    USAGE: [
      '1. Record recipe usage through Operations',
      '2. Or record sales (stock reduces automatically)',
      '3. System tracks all usage with audit trail'
    ],
    ADJUSTMENT: [
      '1. Document reason for adjustment',
      '2. Use Stock Reconciliation tool first',
      '3. Manual adjustments should be rare',
      '4. Consider if this is actually a missing purchase/usage record'
    ]
  }
  
  return guidance[operation]
}

/**
 * Check for potential duplicate stock entries
 */
export async function findPotentialDuplicates(itemId: string, days: number = 7): Promise<{
  duplicateGroups: Array<{
    quantity: number
    logs: Array<{
      id: string
      createdAt: Date
      reason: string | null
      reference: string | null
      userName: string | null
    }>
  }>
}> {
  
  const logs = await prisma.inventoryLog.findMany({
    where: {
      itemId,
      type: 'STOCK_IN',
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  // Group by quantity to find potential duplicates
  const quantityGroups = new Map<number, typeof logs>()
  
  for (const log of logs) {
    const qty = Math.round(log.quantity * 100) / 100 // Round to 2 decimals
    if (!quantityGroups.has(qty)) {
      quantityGroups.set(qty, [])
    }
    quantityGroups.get(qty)!.push(log)
  }
  
  const duplicateGroups = Array.from(quantityGroups.entries())
    .filter(([_, logs]) => logs.length > 1)
    .map(([quantity, logs]) => ({
      quantity,
      logs: logs.map(log => ({
        id: log.id,
        createdAt: log.createdAt,
        reason: log.reason,
        reference: log.reference,
        userName: log.user?.name || 'Unknown'
      }))
    }))
  
  return { duplicateGroups }
}
