'use server'

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface RecipeFormData {
  menuItemId: string
  name: string
  description?: string
  servingSize: number
  ingredients: {
    itemId: string
    quantity: number
    unit: string
  }[]
}

export interface StockUsageData {
  itemId: string
  quantity: number
  usageType: 'RECIPE' | 'WASTAGE' | 'OTHER'
  menuItemId?: string
  orderId?: string
  description?: string
  usageDate?: Date | string
}

export interface MultipleStockUsageEntry {
  itemId: string
  quantity: number
}

export interface MultipleStockUsageData {
  entries: MultipleStockUsageEntry[]
  usageType: 'RECIPE' | 'WASTAGE' | 'OTHER'
  description?: string
  usageDate?: Date | string
}

// Recipe Management - DISABLED: Using MenuItem with RecipeItem instead
export async function createRecipe(data: RecipeFormData) {
  try {
    // This functionality has been moved to MenuItem management
    console.log('Recipe creation moved to MenuItem management')
    return { success: false, message: 'Use MenuItem management for recipes' }
  } catch (error) {
    console.error('Error creating recipe:', error)
    const msg = error instanceof Error ? error.message : 'Failed to create recipe'
    const lower = typeof msg === 'string' ? msg.toLowerCase() : ''
    const transient = lower.includes('deadlock') || lower.includes('timeout') || lower.includes('connection') || lower.includes('econnreset')
    return { success: false, errorCode: transient ? 'TRANSIENT' : 'UNKNOWN', message: msg }
  }
}

export async function updateRecipeCost(recipeId: string) {
  try {
    // This functionality has been moved to MenuItem management
    console.log('Recipe cost update moved to MenuItem management')
    return { success: false, message: 'Use MenuItem management for recipes' }
  } catch (error) {
    console.error('Error updating recipe cost:', error)
    const msg = error instanceof Error ? error.message : 'Failed to update recipe cost'
    const lower = typeof msg === 'string' ? msg.toLowerCase() : ''
    const transient = lower.includes('deadlock') || lower.includes('timeout') || lower.includes('connection') || lower.includes('econnreset')
    return { success: false, errorCode: transient ? 'TRANSIENT' : 'UNKNOWN', message: msg }
  }
}

// Stock Usage Tracking
export async function recordStockUsage(data: StockUsageData) {
  try {
    // Get current stock and item details
    const item = await prisma.item.findUnique({
      where: { id: data.itemId }
    })

    if (!item) {
      return { success: false, errorCode: 'NOT_FOUND', message: 'Item not found' }
    }

    if (item.currentStock < data.quantity) {
      return { success: false, errorCode: 'INSUFFICIENT_STOCK', message: `Insufficient stock. Available: ${item.currentStock} ${item.unit}` }
    }

    // Use the item's cost price for calculation
    const unitPrice = item.costPrice
    const totalCost = data.quantity * unitPrice

    // Get admin user for the record (similar to inventory actions)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return { success: false, errorCode: 'NO_ADMIN', message: 'No admin user found. Please run database seeding first.' }
    }

    // Record stock usage
    const stockUsage = await prisma.stockUsage.create({
      data: {
        itemId: data.itemId,
        quantity: data.quantity,
        unit: item.unit,
        costPerUnit: unitPrice,
        totalCost: totalCost,
        menuItemId: data.menuItemId,
        orderId: data.orderId,
  reason: data.usageType,
  usageDate: data.usageDate ? new Date(data.usageDate) : undefined,
        userId: adminUser.id
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true
          }
        },
        menuItem: {
          select: {
            name: true
          }
        }
      }
    })

    // Update item stock
    await prisma.item.update({
      where: { id: data.itemId },
      data: {
        currentStock: item.currentStock - data.quantity,
        updatedAt: new Date()
      }
    })

    // Also create an inventory log for tracking
    await prisma.inventoryLog.create({
      data: {
        itemId: data.itemId,
        userId: adminUser.id,
        type: 'STOCK_OUT',
        quantity: data.quantity, // positive quantity - the type determines the direction
        previousStock: item.currentStock,
        newStock: item.currentStock - data.quantity,
        reason: `Stock usage: ${data.usageType}${stockUsage.menuItem?.name ? ` for ${stockUsage.menuItem.name}` : ''}`,
        reference: `USAGE-${stockUsage.id}`
      }
    })

    return {
      success: true,
      data: {
        id: stockUsage.id,
        itemName: stockUsage.item.name,
        quantity: stockUsage.quantity,
        unit: stockUsage.unit,
        totalCost: stockUsage.totalCost,
        usageType: stockUsage.reason,
        menuItemName: stockUsage.menuItem?.name
      }
    }

  } catch (error) {
    console.error('Error recording stock usage:', error)
    const msg = error instanceof Error ? error.message : 'Failed to record stock usage'
    const lower = typeof msg === 'string' ? msg.toLowerCase() : ''
    const transient = lower.includes('deadlock') || lower.includes('timeout') || lower.includes('connection') || lower.includes('econnreset')
    return { success: false, errorCode: transient ? 'TRANSIENT' : 'UNKNOWN', message: msg }
  }
}

// Transactional batch recorder: performs all usage records in a single transaction.
export async function recordMultipleStockUsage(data: MultipleStockUsageData) {
  try {
    if (!data?.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
      return { success: false, errorCode: 'VALIDATION', message: 'No entries provided' }
    }

    // Normalize entries and validate numbers
    const entries = data.entries.map(e => ({ itemId: e.itemId, quantity: Number(e.quantity) }))
    if (entries.some(e => !e.itemId || isNaN(e.quantity) || e.quantity <= 0)) {
      return { success: false, errorCode: 'VALIDATION', message: 'Invalid entries provided' }
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Load items
      const itemIds = Array.from(new Set(entries.map(e => e.itemId)))
      const items = await tx.item.findMany({ where: { id: { in: itemIds } } })
      const itemMap = new Map(items.map(i => [i.id, i]))

      // Validate existence and stock
      const notFound = entries.filter(e => !itemMap.has(e.itemId)).map(e => e.itemId)
      if (notFound.length > 0) {
        return { success: false, errorCode: 'NOT_FOUND', message: 'Some items were not found', details: { notFound } }
      }

      const insufficient = [] as Array<{ itemId: string; available: number; requested: number }>
      for (const e of entries) {
        const item = itemMap.get(e.itemId) as any
        if (item.currentStock < e.quantity) {
          insufficient.push({ itemId: e.itemId, available: item.currentStock, requested: e.quantity })
        }
      }

      if (insufficient.length > 0) {
        return { success: false, errorCode: 'INSUFFICIENT_STOCK', message: 'Insufficient stock for some items', details: { insufficient } }
      }

      // Get admin user
      const adminUser = await tx.user.findFirst({ where: { role: 'ADMIN' } })
      if (!adminUser) {
        return { success: false, errorCode: 'NO_ADMIN', message: 'No admin user found. Please seed admin user.' }
      }

      const created: Array<{ itemId: string; usageId: string }> = []
      for (const e of entries) {
        const item = itemMap.get(e.itemId) as any
        const unitPrice = item.costPrice
        const totalCost = e.quantity * unitPrice

        const stockUsage = await tx.stockUsage.create({
          data: {
            itemId: e.itemId,
            quantity: e.quantity,
            unit: item.unit,
            costPerUnit: unitPrice,
            totalCost,
            menuItemId: null,
            orderId: null,
            reason: data.usageType,
            usageDate: data.usageDate ? new Date(data.usageDate) : undefined,
            userId: adminUser.id
          }
        })

        await tx.item.update({ where: { id: e.itemId }, data: { currentStock: item.currentStock - e.quantity, updatedAt: new Date() } })

        await tx.inventoryLog.create({
          data: {
            itemId: e.itemId,
            userId: adminUser.id,
            type: 'STOCK_OUT',
            quantity: -e.quantity,
            previousStock: item.currentStock,
            newStock: item.currentStock - e.quantity,
            reason: `Stock usage: ${data.usageType}`,
            reference: `USAGE-${stockUsage.id}`,
            createdAt: data.usageDate ? new Date(data.usageDate) : undefined
          }
        })

        created.push({ itemId: e.itemId, usageId: stockUsage.id })
      }

      return { success: true, created }
    })

  return result
  } catch (error) {
    console.error('Error recording multiple stock usage:', error)
  const msg = error instanceof Error ? error.message : 'Failed to record multiple stock usage'
  const lower = typeof msg === 'string' ? msg.toLowerCase() : ''
  const transient = lower.includes('deadlock') || lower.includes('timeout') || lower.includes('connection') || lower.includes('econnreset')
  return { success: false, errorCode: transient ? 'TRANSIENT' : 'UNKNOWN', message: msg }
  }
}

// Daily Cost Tracking
export async function getDailyCosts(date: Date) {
  try {
    // Diagnostic logging: incoming date and computed day bounds
    try {
      const sLog = new Date(date)
      sLog.setHours(0, 0, 0, 0)
      const eLog = new Date(date)
      eLog.setHours(23, 59, 59, 999)
      console.log('[getDailyCosts] called', { received: date?.toString?.() || null, start: sLog.toISOString(), end: eLog.toISOString() })
    } catch (e) {
      /* ignore logging errors */
    }
  // Automatically record daily salary expenses for accurate costing
  // Only record salaries when attendance exists for the day (respect attendance)
  const { recordDailySalaryExpenses } = await import('./expenses')
  await recordDailySalaryExpenses(date, { respectAttendance: true })

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Stock usage costs (recipe ingredients, wastage)
    const stockUsage = await prisma.stockUsage.groupBy({
      by: ['reason'],
      where: {
        usageDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        totalCost: true
      },
      _count: {
        id: true
      }
    })

    // Get comprehensive expense breakdown by category type
    const expenseData = await prisma.$queryRaw`
      SELECT 
        SUM(e.amount)::FLOAT as total_expenses,
        SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END)::FLOAT as stock_expenses,
        SUM(CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END)::FLOAT as payroll_expenses,
        SUM(CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END)::FLOAT as operational_expenses,
        SUM(CASE WHEN ec.type = 'UTILITIES' THEN e.amount ELSE 0 END)::FLOAT as utilities_expenses,
        SUM(CASE WHEN ec.type IN ('RENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') 
             THEN e.amount ELSE 0 END)::FLOAT as other_expenses
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e."expenseDate" >= ${startOfDay}
        AND e."expenseDate" <= ${endOfDay}
        AND e.status IN ('APPROVED', 'PAID')
    ` as Array<{
      total_expenses: number
      stock_expenses: number
      payroll_expenses: number
      operational_expenses: number
      utilities_expenses: number
      other_expenses: number
    }>

    // Calculate COGS (Cost of Goods Sold) from inventory logs
    const cogsData = await prisma.$queryRaw`
      SELECT SUM(ABS(il.quantity) * i."costPrice")::FLOAT as total_cogs
      FROM inventory_logs il
      JOIN items i ON il."itemId" = i.id
      WHERE il."createdAt" >= ${startOfDay}
        AND il."createdAt" <= ${endOfDay}
        AND il.type = 'STOCK_OUT'
        AND il.reason ILIKE '%Sale%'
    ` as Array<{ total_cogs: number }>

    const expenses = expenseData[0] || {
      total_expenses: 0,
      stock_expenses: 0,
      payroll_expenses: 0,
      operational_expenses: 0,
      utilities_expenses: 0,
      other_expenses: 0
    }
    
    const cogsAmount = cogsData[0]?.total_cogs || 0

    // Daily sales
    const dailySales = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    })

    const stockCosts = stockUsage.reduce((total, usage) => total + (usage._sum.totalCost || 0), 0)
    
    // Use comprehensive cost calculation (avoid double counting stock purchases vs COGS)
    const totalRecordedExpenses = expenses.total_expenses || 0
    const stockExpensesRecorded = expenses.stock_expenses || 0
    const payrollExpenses = expenses.payroll_expenses || 0
    const operationalExpenses = expenses.operational_expenses || 0
    const utilitiesExpenses = expenses.utilities_expenses || 0
    const otherExpenses = expenses.other_expenses || 0
    
    // Replace recorded stock expenses with actual COGS + stock usage to avoid double counting
    const effectiveTotalExpenses = totalRecordedExpenses - stockExpensesRecorded + cogsAmount + stockCosts
    
    const totalSales = dailySales._sum.totalAmount || 0
    const netProfit = totalSales - effectiveTotalExpenses
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

    return {
      success: true,
      dailySummary: {
        date: date.toISOString().split('T')[0],
        revenue: totalSales,
        costs: {
          stockUsage: stockCosts,
          cogs: cogsAmount,
          payroll: payrollExpenses,
          operational: operationalExpenses,
          utilities: utilitiesExpenses,
          other: otherExpenses,
          recordedStockPurchases: stockExpensesRecorded,
          totalRecorded: totalRecordedExpenses,
          total: effectiveTotalExpenses
        },
        profit: {
          net: netProfit,
          margin: profitMargin
        },
        transactions: {
          sales: dailySales._count.id,
          stockUsage: stockUsage.reduce((total, usage) => total + usage._count.id, 0)
        },
        breakdown: {
          stockUsage: stockUsage.map(usage => ({
            type: usage.reason,
            cost: usage._sum.totalCost || 0,
            count: usage._count.id
          })),
          expenseBreakdown: {
            payroll: payrollExpenses,
            operational: operationalExpenses,
            utilities: utilitiesExpenses,
            other: otherExpenses,
            cogs: cogsAmount,
            stockUsage: stockCosts
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting daily costs:', error)
    return { success: false, error: 'Failed to get daily costs' }
  }
}

// Weekly/Monthly/Yearly Summary
export async function getPeriodSummary(startDate: Date | string, endDate: Date | string) {
  try {
    // Robust date parsing: handle 'YYYY-MM-DD' strings (no timezone) explicitly
    const parseDateOnly = (v: any) => {
      if (typeof v !== 'string') return null
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!m) return null
      const y = Number(m[1])
      const mo = Number(m[2]) - 1
      const d = Number(m[3])
      return new Date(y, mo, d)
    }

    let s: Date | null = null
    let e: Date | null = null

    if (startDate instanceof Date) s = new Date(startDate)
    else if (typeof startDate === 'string') s = parseDateOnly(startDate) || new Date(startDate)

    if (endDate instanceof Date) e = new Date(endDate)
    else if (typeof endDate === 'string') e = parseDateOnly(endDate) || new Date(endDate)

    // Fallback to today if parsing fails (defensive)
    if (!s) s = new Date()
    if (!e) e = new Date()

    // Normalize to full-day bounds (local time)
    s.setHours(0, 0, 0, 0)
    e.setHours(23, 59, 59, 999)

    // defensive: if start is after end, swap them
    if (s.getTime() > e.getTime()) {
      const tmp = s
      s = e
      e = tmp
    }

    startDate = s
    endDate = e

    // log range for server-side diagnosis (visible in Vercel logs)
    console.log('getPeriodSummary range:', typeof startDate, startDate.toISOString(), typeof endDate, endDate.toISOString())

  const summary = await prisma.$queryRaw`
      SELECT 
        dates.date::date as date,
        COALESCE(SUM(s."totalAmount"), 0)::FLOAT as daily_sales,
        COALESCE(stock_usage_costs.total_cost, 0)::FLOAT as stock_usage_costs,
        COALESCE(cogs_costs.total_cost, 0)::FLOAT as cogs_costs,
        COALESCE(expense_costs.payroll_expenses, 0)::FLOAT as payroll_expenses,
        COALESCE(expense_costs.operational_expenses, 0)::FLOAT as operational_expenses,
        COALESCE(expense_costs.utilities_expenses, 0)::FLOAT as utilities_expenses,
        COALESCE(expense_costs.other_expenses, 0)::FLOAT as other_expenses,
        COALESCE(expense_costs.stock_expenses, 0)::FLOAT as recorded_stock_expenses
      FROM generate_series(date_trunc('day', ${startDate}::timestamp), date_trunc('day', ${endDate}::timestamp), '1 day'::interval) as dates(date)
      LEFT JOIN sales s ON DATE(s."saleDate") = dates.date AND s.status = 'COMPLETED'
      LEFT JOIN (
        SELECT 
          DATE(su."usageDate") as date,
          SUM(su."totalCost") as total_cost
        FROM stock_usage su
        WHERE su."usageDate" >= ${startDate} AND su."usageDate" <= ${endDate}
        GROUP BY DATE(su."usageDate")
      ) stock_usage_costs ON stock_usage_costs.date = dates.date
      LEFT JOIN (
        SELECT
          DATE(il."createdAt") as date,
          SUM(ABS(il.quantity) * i."costPrice") as total_cost
        FROM inventory_logs il
        JOIN items i ON il."itemId" = i.id
        WHERE il."createdAt" >= ${startDate} AND il."createdAt" <= ${endDate}
          AND il.type = 'STOCK_OUT'
          AND il.reason ILIKE '%Sale%'
        GROUP BY DATE(il."createdAt")
      ) cogs_costs ON cogs_costs.date = dates.date
      LEFT JOIN (
        SELECT 
          DATE(e."expenseDate") as date,
          SUM(CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END) as payroll_expenses,
          SUM(CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END) as operational_expenses,
          SUM(CASE WHEN ec.type = 'UTILITIES' THEN e.amount ELSE 0 END) as utilities_expenses,
          SUM(CASE WHEN ec.type IN ('RENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') THEN e.amount ELSE 0 END) as other_expenses,
          SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END) as stock_expenses
        FROM expenses e
        JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
        WHERE e."expenseDate" >= ${startDate} 
          AND e."expenseDate" <= ${endDate}
          AND e.status IN ('APPROVED', 'PAID')
        GROUP BY DATE(e."expenseDate")
      ) expense_costs ON expense_costs.date = dates.date
      GROUP BY dates.date, stock_usage_costs.total_cost, cogs_costs.total_cost, expense_costs.payroll_expenses, expense_costs.operational_expenses, expense_costs.utilities_expenses, expense_costs.other_expenses, expense_costs.stock_expenses
      ORDER BY dates.date
    ` as Array<{
      date: Date
      daily_sales: number
      stock_usage_costs: number
      cogs_costs: number
      payroll_expenses: number
      operational_expenses: number
      utilities_expenses: number
      other_expenses: number
      recorded_stock_expenses: number
    }>

    // Log summary size + sample for debugging
    try {
      console.log('getPeriodSummary returned rows:', summary.length)
      console.log('getPeriodSummary sample:', JSON.stringify(summary.slice(0, 3)))
    } catch (e) {
      // ignore logging errors
    }

    const periodData = summary.map(day => {
      // Calculate comprehensive costs using the same logic as daily costs
      const stockUsageCosts = day.stock_usage_costs || 0
      const cogsCosts = day.cogs_costs || 0
      const payrollExpenses = day.payroll_expenses || 0
      const operationalExpenses = day.operational_expenses || 0
      const utilitiesExpenses = day.utilities_expenses || 0
      const otherExpenses = day.other_expenses || 0
      const recordedStockExpenses = day.recorded_stock_expenses || 0
      
      // Replace recorded stock expenses with actual COGS + stock usage to avoid double counting
      const totalRecordedExpenses = payrollExpenses + operationalExpenses + utilitiesExpenses + otherExpenses + recordedStockExpenses
      const effectiveTotalCosts = totalRecordedExpenses - recordedStockExpenses + cogsCosts + stockUsageCosts
      
      const profit = day.daily_sales - effectiveTotalCosts
      const profitMargin = day.daily_sales > 0 ? (profit / day.daily_sales) * 100 : 0

      return {
        date: day.date.toISOString().split('T')[0],
        sales: day.daily_sales,
        costs: {
          stockUsage: stockUsageCosts,
          cogs: cogsCosts,
          payroll: payrollExpenses,
          operational: operationalExpenses,
          utilities: utilitiesExpenses,
          other: otherExpenses,
          total: effectiveTotalCosts
        },
        profit: {
          amount: profit,
          margin: profitMargin
        }
      }
    })

    const totals = periodData.reduce((acc, day) => ({
      sales: acc.sales + day.sales,
      costs: acc.costs + day.costs.total,
      profit: acc.profit + day.profit.amount
    }), { sales: 0, costs: 0, profit: 0 })

    return {
      success: true,
      summary: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totals: {
          ...totals,
          profitMargin: totals.sales > 0 ? (totals.profit / totals.sales) * 100 : 0
        },
        dailyBreakdown: periodData
      }
    }
  } catch (error) {
    console.error('Error getting period summary:', error)
    return { success: false, error: 'Failed to get period summary' }
  }
}

export async function getMenuItemProfitability() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        recipeItems: {
          include: {
            item: true
          }
        },
        orderItems: {
          include: {
            order: {
              include: {
                sale: true
              }
            }
          }
        }
      }
    })

    const profitability = menuItems.map(menuItem => {
      // Calculate recipe cost from recipeItems
      const recipeCost = menuItem.recipeItems.reduce((sum, recipeItem) => 
        sum + (recipeItem.quantity * recipeItem.item.costPrice), 0
      )
      
      // Calculate total sales for this menu item
      const totalSales = menuItem.orderItems.reduce((sum: number, orderItem: any) => 
        sum + (orderItem.unitPrice * orderItem.quantity), 0
      )
      
      const totalQuantitySold = menuItem.orderItems.reduce((sum: number, orderItem: any) => 
        sum + orderItem.quantity, 0
      )

      const totalCost = totalQuantitySold * recipeCost
      const profit = totalSales - totalCost
      const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0

      return {
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price
        },
        recipe: {
          cost: recipeCost,
          ingredients: menuItem.recipeItems.length || 0
        },
        performance: {
          quantitySold: totalQuantitySold,
          totalSales: totalSales,
          totalCost: totalCost,
          profit: profit,
          profitMargin: profitMargin
        }
      }
    })

    return { success: true, profitability }
  } catch (error) {
    console.error('Error getting menu item profitability:', error)
    return { success: false, error: 'Failed to get menu item profitability' }
  }
}

// Update Stock Usage Record
export async function updateStockUsage(usageId: string, data: {
  quantity?: number
  usageType?: 'RECIPE' | 'WASTAGE' | 'OTHER'
  menuItemId?: string
  description?: string
  usageDate?: Date | string
}) {
  try {
    // Input validation
    if (!usageId || typeof usageId !== 'string') {
      return { success: false, message: 'Invalid usage ID provided' }
    }

    // Get existing usage record with item details
    const existingUsage = await prisma.stockUsage.findUnique({
      where: { id: usageId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            costPrice: true,
            unit: true
          }
        }
      }
    })

    if (!existingUsage) {
      return { success: false, message: 'Stock usage record not found' }
    }

    // Start transaction to handle stock adjustments
    await prisma.$transaction(async (tx) => {
      const oldQuantity = existingUsage.quantity
      const newQuantity = data.quantity !== undefined ? data.quantity : oldQuantity
      const quantityDifference = newQuantity - oldQuantity

      // Update the usage record
      const updatedUsage = await tx.stockUsage.update({
        where: { id: usageId },
        data: {
          quantity: newQuantity,
          totalCost: newQuantity * existingUsage.item.costPrice,
          reason: data.usageType || existingUsage.reason,
          menuItemId: data.menuItemId !== undefined ? data.menuItemId : existingUsage.menuItemId,
          description: data.description !== undefined ? data.description : existingUsage.description,
          usageDate: data.usageDate ? new Date(data.usageDate) : existingUsage.usageDate,
          updatedAt: new Date()
        }
      })

      // Adjust item stock if quantity changed
      if (quantityDifference !== 0) {
        const newItemStock = existingUsage.item.currentStock - quantityDifference
        
        if (newItemStock < 0) {
          throw new Error(`Insufficient stock. This would result in negative stock (${newItemStock.toFixed(2)} ${existingUsage.item.unit})`)
        }

        await tx.item.update({
          where: { id: existingUsage.itemId },
          data: {
            currentStock: newItemStock,
            updatedAt: new Date()
          }
        })

        // Create inventory log for the adjustment
        const adminUser = await tx.user.findFirst({
          where: { role: 'ADMIN' }
        })

        if (adminUser) {
          await tx.inventoryLog.create({
            data: {
              itemId: existingUsage.itemId,
              userId: adminUser.id,
              type: 'ADJUSTMENT',
              quantity: -quantityDifference, // Negative because we're adjusting usage
              previousStock: existingUsage.item.currentStock,
              newStock: newItemStock,
              reason: `Stock usage adjustment: ${oldQuantity} ${existingUsage.item.unit} → ${newQuantity} ${existingUsage.item.unit}`
            }
          })
        }
      }
    })

    return { 
      success: true, 
      message: `Stock usage updated successfully. ${data.quantity !== undefined ? `Quantity: ${existingUsage.quantity} → ${data.quantity} ${existingUsage.item.unit}` : ''}`.trim()
    }
  } catch (error: any) {
    console.error('Error updating stock usage:', error)
    
    if (error.message?.includes('Insufficient stock')) {
      return { success: false, message: error.message }
    }
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update stock usage'
    }
  }
}

// Delete Stock Usage Record
export async function deleteStockUsage(usageId: string) {
  try {
    // Input validation
    if (!usageId || typeof usageId !== 'string') {
      return { success: false, message: 'Invalid usage ID provided' }
    }

    // Get existing usage record with item details
    const existingUsage = await prisma.stockUsage.findUnique({
      where: { id: usageId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            unit: true
          }
        }
      }
    })

    if (!existingUsage) {
      return { success: false, message: 'Stock usage record not found' }
    }

    // Start transaction to reverse stock adjustment and delete record
    await prisma.$transaction(async (tx) => {
      // Restore the stock by adding back the used quantity
      const restoredStock = existingUsage.item.currentStock + existingUsage.quantity

      await tx.item.update({
        where: { id: existingUsage.itemId },
        data: {
          currentStock: restoredStock,
          updatedAt: new Date()
        }
      })

      // Create inventory log for the restoration
      const adminUser = await tx.user.findFirst({
        where: { role: 'ADMIN' }
      })

      if (adminUser) {
        await tx.inventoryLog.create({
          data: {
            itemId: existingUsage.itemId,
            userId: adminUser.id,
            type: 'ADJUSTMENT',
            quantity: existingUsage.quantity, // Positive because we're restoring stock
            previousStock: existingUsage.item.currentStock,
            newStock: restoredStock,
            reason: `Stock usage deleted - restored ${existingUsage.quantity} ${existingUsage.item.unit}`
          }
        })
      }

      // Delete the usage record
      await tx.stockUsage.delete({
        where: { id: usageId }
      })
    })

    return { 
      success: true, 
      message: `Stock usage deleted and ${existingUsage.quantity} ${existingUsage.item.unit} restored to ${existingUsage.item.name}`
    }
  } catch (error: any) {
    console.error('Error deleting stock usage:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete stock usage'
    }
  }
}
