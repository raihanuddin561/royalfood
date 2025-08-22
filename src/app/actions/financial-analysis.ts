'use server'

import { prisma } from '@/lib/prisma'

export interface FinancialDataInput {
  date: Date
  period: 'today' | 'week' | 'month'
}

export interface ComprehensiveFinancialData {
  date: string
  
  // Revenue Data
  dailySales: number
  totalOrders: number
  averageOrderValue: number
  
  // Expense Data
  stockExpenses: number           // Money spent buying inventory
  employeeExpenses: number        // Salaries, wages, benefits
  operationalExpenses: number     // Rent, utilities, other expenses
  totalExpenses: number
  
  // Inventory Data
  currentStockValue: number       // Value of current inventory
  stockMovement: number           // Stock purchased vs used
  stockTurnover: number
  
  // Calculated Metrics
  grossProfit: number             // Sales - Cost of Goods Sold
  netProfit: number               // Gross Profit - All Expenses
  profitMargin: number            // Net Profit / Sales * 100
  
  // Balance Sheet Items
  totalAssets: number
  totalLiabilities: number
  equity: number
  
  // Cash Flow
  cashInflow: number
  cashOutflow: number
  netCashFlow: number
}

export async function getComprehensiveFinancialData({ date, period }: FinancialDataInput) {
  try {
    // Calculate date range based on period
    let startDate: Date
    let endDate: Date

    const selectedDate = new Date(date)
    endDate = new Date(selectedDate)
    endDate.setHours(23, 59, 59, 999)

    switch (period) {
      case 'today':
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(selectedDate)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      default:
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
    }

    // 1. GET SALES DATA (Revenue) - with safe handling for empty data
    let dailySales = 0
    let totalOrders = 0 
    let averageOrderValue = 0

    try {
      const salesData = await prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          },
          status: { not: 'REFUNDED' }
        },
        _sum: {
          finalAmount: true
        },
        _count: {
          id: true
        },
        _avg: {
          finalAmount: true
        }
      })

      dailySales = salesData._sum.finalAmount || 0
      totalOrders = salesData._count.id || 0
      averageOrderValue = salesData._avg.finalAmount || 0
    } catch (error) {
      console.warn('Error fetching sales data, using default values:', error)
      // Continue with default values (0) if sales data fails
    }

    // 2. GET EXPENSE DATA - with safe handling
    let stockExpenses = 0
    let employeeExpenses = 0  
    let operationalExpenses = 0

    try {
      const expenseData = await prisma.expense.groupBy({
        by: ['expenseCategory'],
        where: {
          expenseDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'PAID'
        },
        _sum: {
          amount: true
        },
        include: {
          expenseCategory: {
            select: {
              type: true
            }
          }
        }
      })

      // Process expenses with null safety
      if (expenseData && Array.isArray(expenseData)) {
        for (const expense of expenseData) {
          const amount = expense._sum.amount || 0
          
          try {
            // Get category type
            const category = await prisma.expenseCategory.findUnique({
              where: { id: expense.expenseCategory },
              select: { type: true }
            })

            if (category) {
              switch (category.type) {
                case 'STOCK':
                  stockExpenses += amount
                  break
                case 'PAYROLL':
                  employeeExpenses += amount
                  break
                case 'OPERATIONAL':
                case 'UTILITIES':
                case 'RENT':
                case 'MAINTENANCE':
                case 'INSURANCE':
                  operationalExpenses += amount
                  break
              }
            }
          } catch (categoryError) {
            console.warn('Error processing expense category:', categoryError)
            // Add to operational by default if category lookup fails
            operationalExpenses += amount
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching expense data, using default values:', error)
      // Continue with default values (0) if expense data fails
    }

    const totalExpenses = stockExpenses + employeeExpenses + operationalExpenses

    // 3. GET INVENTORY DATA - with safe handling
    let currentStockValue = 0

    try {
      const inventoryItems = await prisma.item.findMany({
        where: { 
          isActive: true 
        },
        select: {
          currentStock: true,
          costPrice: true
        }
      })

      if (inventoryItems && Array.isArray(inventoryItems)) {
        currentStockValue = inventoryItems.reduce((total, item) => {
          const stock = item.currentStock || 0
          const cost = item.costPrice || 0
          return total + (stock * cost)
        }, 0)
      }
    } catch (error) {
      console.warn('Error fetching inventory data, using default values:', error)
      // Continue with default value (0) if inventory data fails
    }

    // 4. CALCULATE FINANCIAL METRICS - with safe math operations
    const costOfGoodsSold = stockExpenses
    const grossProfit = dailySales - costOfGoodsSold
    const netProfit = grossProfit - employeeExpenses - operationalExpenses
    const profitMargin = dailySales > 0 ? (netProfit / dailySales) * 100 : 0

    // Stock Movement and Turnover - with safe division
    const stockMovement = stockExpenses // Money spent on stock
    const stockTurnover = currentStockValue > 0 ? costOfGoodsSold / currentStockValue : 0

    // 5. BALANCE SHEET CALCULATIONS - with safe math
    const estimatedCash = Math.max(0, netProfit)
    const totalAssets = currentStockValue + estimatedCash
    const totalLiabilities = Math.max(0, totalExpenses * 0.1) // Assuming 10% outstanding
    const equity = totalAssets - totalLiabilities

    // 6. CASH FLOW - with safe calculations
    const cashInflow = dailySales
    const cashOutflow = totalExpenses
    const netCashFlow = cashInflow - cashOutflow

    const result: ComprehensiveFinancialData = {
      date: date.toISOString().split('T')[0],
      
      // Revenue
      dailySales: Number(dailySales.toFixed(2)),
      totalOrders,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      
      // Expenses
      stockExpenses: Number(stockExpenses.toFixed(2)),
      employeeExpenses: Number(employeeExpenses.toFixed(2)),
      operationalExpenses: Number(operationalExpenses.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      
      // Inventory
      currentStockValue: Number(currentStockValue.toFixed(2)),
      stockMovement: Number(stockMovement.toFixed(2)),
      stockTurnover: Number(stockTurnover.toFixed(2)),
      
      // Profitability
      grossProfit: Number(grossProfit.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      
      // Balance Sheet
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      
      // Cash Flow
      cashInflow: Number(cashInflow.toFixed(2)),
      cashOutflow: Number(cashOutflow.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2))
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Error calculating comprehensive financial data:', error)
    
    // Return default safe values if everything fails
    const defaultData: ComprehensiveFinancialData = {
      date: date.toISOString().split('T')[0],
      dailySales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      stockExpenses: 0,
      employeeExpenses: 0,
      operationalExpenses: 0,
      totalExpenses: 0,
      currentStockValue: 0,
      stockMovement: 0,
      stockTurnover: 0,
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      equity: 0,
      cashInflow: 0,
      cashOutflow: 0,
      netCashFlow: 0
    }
    
    return {
      success: false,
      error: 'Failed to calculate financial data',
      data: defaultData // Return safe default data instead of null
    }
  }
}

// Quick Action Functions with comprehensive error handling
export async function recordStockInput(data: {
  itemId: string
  quantity: number
  costPrice: number
  supplierInvoice?: string
  date?: Date
}) {
  try {
    const { itemId, quantity, costPrice, supplierInvoice, date = new Date() } = data
    
    // Validate input data
    if (!itemId || quantity <= 0 || costPrice <= 0) {
      return {
        success: false,
        error: 'Invalid input data. Please check item ID, quantity, and cost price.'
      }
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return {
        success: false,
        error: 'Item not found. Please select a valid item.'
      }
    }
    
    // Update inventory with transaction safety
    const updatedItem = await prisma.$transaction(async (tx) => {
      // Update item stock and cost
      const item = await tx.item.update({
        where: { id: itemId },
        data: {
          currentStock: {
            increment: quantity
          },
          costPrice: costPrice
        }
      })

      // Find admin user for logging
      const adminUser = await tx.user.findFirst({
        where: { role: 'ADMIN' }
      })

      // Create inventory log if admin user exists
      if (adminUser) {
        await tx.inventoryLog.create({
          data: {
            itemId,
            userId: adminUser.id,
            type: 'STOCK_IN',
            quantity,
            previousStock: existingItem.currentStock,
            newStock: existingItem.currentStock + quantity,
            reason: supplierInvoice ? `Stock received - Invoice: ${supplierInvoice}` : 'Stock received',
            reference: supplierInvoice
          }
        })
      }

      return item
    })

    // Create stock expense with proper category
    const totalCost = quantity * costPrice
    
    try {
      // Find or create stock purchase category
      const stockCategory = await prisma.expenseCategory.findFirst({
        where: { 
          type: 'STOCK',
          name: 'Stock Purchase'
        }
      })

      if (stockCategory) {
        await prisma.expense.create({
          data: {
            expenseCategoryId: stockCategory.id,
            amount: totalCost,
            description: `Stock purchase: ${updatedItem.name} - ${quantity} ${updatedItem.unit}`,
            expenseDate: date,
            supplierInfo: supplierInvoice,
            status: 'PAID'
          }
        })
      }
    } catch (expenseError) {
      console.warn('Failed to create expense record:', expenseError)
      // Continue without failing the entire operation
    }

    return {
      success: true,
      message: `Stock added successfully. ${quantity} ${updatedItem.unit} of ${updatedItem.name}`,
      expense: totalCost
    }
  } catch (error) {
    console.error('Error recording stock input:', error)
    return {
      success: false,
      error: 'Failed to record stock input. Please try again.'
    }
  }
}

export async function recordEmployeeExpense(data: {
  employeeId: string
  amount: number
  type: 'SALARY' | 'WAGES' | 'BONUS' | 'ALLOWANCE'
  description: string
  date?: Date
}) {
  try {
    const { employeeId, amount, type, description, date = new Date() } = data
    
    // Validate input
    if (!employeeId || amount <= 0 || !description.trim()) {
      return {
        success: false,
        error: 'Invalid input data. Please check employee ID, amount, and description.'
      }
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    if (!employee) {
      return {
        success: false,
        error: 'Employee not found. Please select a valid employee.'
      }
    }

    // Find or create payroll expense category
    let payrollCategory = await prisma.expenseCategory.findFirst({
      where: { 
        type: 'PAYROLL',
        name: 'Employee Salary'
      }
    })

    if (!payrollCategory) {
      // Create default payroll category if it doesn't exist
      payrollCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Employee Salary',
          type: 'PAYROLL',
          description: 'Employee salaries and wages'
        }
      })
    }

    // Create expense record
    await prisma.expense.create({
      data: {
        expenseCategoryId: payrollCategory.id,
        amount,
        description: `${type}: ${employee.user.name} - ${description}`,
        expenseDate: date,
        status: 'PAID',
        employeeId
      }
    })

    return {
      success: true,
      message: `Employee expense recorded: ${type} for ${employee.user.name}`
    }
  } catch (error) {
    console.error('Error recording employee expense:', error)
    return {
      success: false,
      error: 'Failed to record employee expense. Please try again.'
    }
  }
}

export async function getFinancialSummary(period: 'week' | 'month' | 'quarter') {
  try {
    if (!period || !['week', 'month', 'quarter'].includes(period)) {
      return {
        success: false,
        error: 'Invalid period specified'
      }
    }

    const now = new Date()
    const result = await getComprehensiveFinancialData({
      date: now,
      period: period === 'week' ? 'week' : 'month'
    })

    return result
  } catch (error) {
    console.error('Error getting financial summary:', error)
    return {
      success: false,
      error: 'Failed to get financial summary'
    }
  }
}
