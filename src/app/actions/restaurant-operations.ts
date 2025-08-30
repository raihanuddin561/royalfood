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

// Recipe Management
export async function createRecipe(data: RecipeFormData) {
  try {
    const recipe = await prisma.recipe.create({
      data: {
        menuItemId: data.menuItemId,
        name: data.name,
        description: data.description,
        servingSize: data.servingSize,
        ingredients: {
          create: data.ingredients.map(ingredient => ({
            itemId: ingredient.itemId,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            item: true
          }
        },
        menuItem: true
      }
    })

    // Calculate and update recipe cost
    await updateRecipeCost(recipe.id)

  return { success: true, recipe }
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
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            item: true
          }
        }
      }
    })

  if (!recipe) return { success: false, errorCode: 'NOT_FOUND', message: 'Recipe not found' }

    let totalCost = 0

    for (const ingredient of recipe.ingredients) {
      // Get latest purchase price for the item
      const latestPurchase = await prisma.purchaseItem.findFirst({
        where: { itemId: ingredient.itemId },
        orderBy: { purchase: { purchaseDate: 'desc' } },
        include: { purchase: true }
      })

      if (latestPurchase) {
        const costPerUnit = latestPurchase.unitPrice
        const ingredientCost = ingredient.quantity * costPerUnit
        totalCost += ingredientCost
      }
    }

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { totalCost: totalCost }
    })

  return { success: true, totalCost }
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
        quantity: -data.quantity, // negative for stock out
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

    // Employee costs (payroll)
    const employeeCosts = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        expenseCategory: {
          type: 'PAYROLL'
        },
        status: 'APPROVED'
      },
      _sum: {
        amount: true
      }
    })

    // Other operational expenses
    const operationalCosts = await prisma.expense.groupBy({
      by: ['expenseCategoryId'],
      where: {
        expenseDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        expenseCategory: {
          type: {
            not: 'PAYROLL'
          }
        },
        status: 'APPROVED'
      },
      _sum: {
        amount: true
      }
    })

    // Get category names for operational costs
    const operationalCategories = await prisma.expenseCategory.findMany({
      where: {
        id: {
          in: operationalCosts.map(cost => cost.expenseCategoryId)
        }
      }
    })

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
    const totalEmployeeCosts = employeeCosts._sum.amount || 0
    const totalOperationalCosts = operationalCosts.reduce((total, expense) => total + (expense._sum.amount || 0), 0)
    const totalSales = dailySales._sum.totalAmount || 0

    const totalCosts = stockCosts + totalEmployeeCosts + totalOperationalCosts
    const grossProfit = totalSales - totalCosts
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0

    return {
      success: true,
      dailySummary: {
        date: date.toISOString().split('T')[0],
        revenue: totalSales,
        costs: {
          stock: stockCosts,
          employee: totalEmployeeCosts,
          operational: totalOperationalCosts,
          total: totalCosts
        },
        profit: {
          gross: grossProfit,
          margin: profitMargin
        },
        transactions: {
          sales: dailySales._count.id,
          stockUsage: stockUsage.reduce((total, usage) => total + usage._count.id, 0)
        },
        breakdown: {
          stockUsage: stockUsage.map(usage => ({
            type: usage.usageType,
            cost: usage._sum.totalCost || 0,
            count: usage._count.id
          })),
          operationalCosts: operationalCosts.map(expense => {
            const category = operationalCategories.find(cat => cat.id === expense.expenseCategoryId)
            return {
              category: category?.name || 'Unknown',
              cost: expense._sum.amount || 0
            }
          })
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
        DATE(s."saleDate") as date,
        COALESCE(SUM(s."totalAmount"), 0)::FLOAT as daily_sales,
        COALESCE(stock_costs.total_cost, 0)::FLOAT as stock_costs,
        COALESCE(employee_costs.total_cost, 0)::FLOAT as employee_costs,
        COALESCE(operational_costs.total_cost, 0)::FLOAT as operational_costs
  FROM generate_series(date_trunc('day', ${startDate}::timestamp), date_trunc('day', ${endDate}::timestamp), '1 day'::interval) as dates(date)
      LEFT JOIN sales s ON DATE(s."saleDate") = dates.date
      LEFT JOIN (
        SELECT 
          DATE(su."usageDate") as date,
          SUM(su."totalCost") as total_cost
        FROM stock_usage su
        WHERE su."usageDate" >= ${startDate} AND su."usageDate" <= ${endDate}
        GROUP BY DATE(su."usageDate")
      ) stock_costs ON stock_costs.date = dates.date
      LEFT JOIN (
        SELECT 
          DATE(e."expenseDate") as date,
          SUM(e.amount) as total_cost
        FROM expenses e
        JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
        WHERE e."expenseDate" >= ${startDate} 
          AND e."expenseDate" <= ${endDate}
          AND ec.type = 'PAYROLL'
          AND e.status = 'APPROVED'
        GROUP BY DATE(e."expenseDate")
      ) employee_costs ON employee_costs.date = dates.date
      LEFT JOIN (
        SELECT 
          DATE(e."expenseDate") as date,
          SUM(e.amount) as total_cost
        FROM expenses e
        JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
        WHERE e."expenseDate" >= ${startDate} 
          AND e."expenseDate" <= ${endDate}
          AND ec.type != 'PAYROLL'
          AND e.status = 'APPROVED'
        GROUP BY DATE(e."expenseDate")
      ) operational_costs ON operational_costs.date = dates.date
      GROUP BY dates.date, stock_costs.total_cost, employee_costs.total_cost, operational_costs.total_cost
      ORDER BY dates.date
    ` as Array<{
      date: Date
      daily_sales: number
      stock_costs: number
      employee_costs: number
      operational_costs: number
    }>

    // Log summary size + sample for debugging
    try {
      console.log('getPeriodSummary returned rows:', summary.length)
      console.log('getPeriodSummary sample:', JSON.stringify(summary.slice(0, 3)))
    } catch (e) {
      // ignore logging errors
    }

    const periodData = summary.map(day => {
      const totalCosts = day.stock_costs + day.employee_costs + day.operational_costs
      const profit = day.daily_sales - totalCosts
      const profitMargin = day.daily_sales > 0 ? (profit / day.daily_sales) * 100 : 0

      return {
        date: day.date.toISOString().split('T')[0],
        sales: day.daily_sales,
        costs: {
          stock: day.stock_costs,
          employee: day.employee_costs,
          operational: day.operational_costs,
          total: totalCosts
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
        recipe: {
          include: {
            ingredients: {
              include: {
                item: true
              }
            }
          }
        },
        orderItems: {
          include: {
            order: {
              include: {
                sales: true
              }
            }
          }
        }
      }
    })

    const profitability = menuItems.map(menuItem => {
      const recipe = menuItem.recipe
      const recipeCost = recipe?.totalCost || 0
      
      // Calculate total sales for this menu item
      const totalSales = menuItem.orderItems.reduce((sum, orderItem) => 
        sum + (orderItem.unitPrice * orderItem.quantity), 0
      )
      
      const totalQuantitySold = menuItem.orderItems.reduce((sum, orderItem) => 
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
          ingredients: recipe?.ingredients.length || 0
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
