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
    return { success: false, error: 'Failed to create recipe' }
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

    if (!recipe) return { success: false, error: 'Recipe not found' }

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
    return { success: false, error: 'Failed to update recipe cost' }
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
      return { success: false, error: 'Item not found' }
    }

    if (item.currentStock < data.quantity) {
      return { success: false, error: `Insufficient stock. Available: ${item.currentStock} ${item.unit}` }
    }

    // Use the item's cost price for calculation
    const unitPrice = item.costPrice
    const totalCost = data.quantity * unitPrice

    // Get admin user for the record (similar to inventory actions)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return { success: false, error: 'No admin user found. Please run database seeding first.' }
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
    return { success: false, error: 'Failed to record stock usage' }
  }
}

// Daily Cost Tracking
export async function getDailyCosts(date: Date) {
  try {
    // Automatically record daily salary expenses for accurate costing
    const { recordDailySalaryExpenses } = await import('./expenses')
    await recordDailySalaryExpenses(date)

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
export async function getPeriodSummary(startDate: Date, endDate: Date) {
  try {
    const summary = await prisma.$queryRaw`
      SELECT 
        DATE(s.sale_date) as date,
        COALESCE(SUM(s.total_amount), 0)::FLOAT as daily_sales,
        COALESCE(stock_costs.total_cost, 0)::FLOAT as stock_costs,
        COALESCE(employee_costs.total_cost, 0)::FLOAT as employee_costs,
        COALESCE(operational_costs.total_cost, 0)::FLOAT as operational_costs
      FROM generate_series(${startDate}, ${endDate}, '1 day'::interval) as dates(date)
      LEFT JOIN sales s ON DATE(s.sale_date) = dates.date
      LEFT JOIN (
        SELECT 
          DATE(su.usage_date) as date,
          SUM(su.total_cost) as total_cost
        FROM stock_usage su
        WHERE su.usage_date >= ${startDate} AND su.usage_date <= ${endDate}
        GROUP BY DATE(su.usage_date)
      ) stock_costs ON stock_costs.date = dates.date
      LEFT JOIN (
        SELECT 
          DATE(e.expense_date) as date,
          SUM(e.amount) as total_cost
        FROM expenses e
        JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
        WHERE e.expense_date >= ${startDate} 
          AND e.expense_date <= ${endDate}
          AND ec.type = 'PAYROLL'
          AND e.status = 'APPROVED'
        GROUP BY DATE(e.expense_date)
      ) employee_costs ON employee_costs.date = dates.date
      LEFT JOIN (
        SELECT 
          DATE(e.expense_date) as date,
          SUM(e.amount) as total_cost
        FROM expenses e
        JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
        WHERE e.expense_date >= ${startDate} 
          AND e.expense_date <= ${endDate}
          AND ec.type != 'PAYROLL'
          AND e.status = 'APPROVED'
        GROUP BY DATE(e.expense_date)
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
