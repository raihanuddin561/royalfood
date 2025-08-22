'use server'

import { prisma } from '@/lib/prisma'
import { ExpenseType, ExpenseStatus, RecurringPeriod, ReportType } from '@prisma/client'

export interface ExpenseFormData {
  expenseCategoryId: string
  description: string
  amount: number
  expenseDate: Date
  receiptImage?: string
  supplierInfo?: string
  payrollId?: string
  employeeId?: string
  purchaseId?: string
  taxAmount?: number
  isRecurring?: boolean
  recurringPeriod?: RecurringPeriod
  nextDueDate?: Date
  notes?: string
  status?: ExpenseStatus
}

export interface ExpenseCategoryFormData {
  name: string
  description?: string
  type: ExpenseType
}

// Expense CRUD Operations
export async function createExpense(data: ExpenseFormData) {
  try {
    const expense = await prisma.expense.create({
      data: {
        ...data,
        taxAmount: data.taxAmount || 0,
        isRecurring: data.isRecurring || false,
      },
      include: {
        expenseCategory: true,
        payroll: {
          include: {
            employee: {
              include: {
                user: true
              }
            }
          }
        },
        employee: {
          include: {
            user: true
          }
        },
        purchase: {
          include: {
            supplier: true
          }
        }
      }
    })

    // If it's a recurring expense, create next occurrence
    if (data.isRecurring && data.recurringPeriod && data.nextDueDate) {
      await createRecurringExpenseSchedule(expense.id, data.recurringPeriod, data.nextDueDate)
    }

    return { success: true, expense }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, error: 'Failed to create expense' }
  }
}

export async function updateExpense(id: string, data: Partial<ExpenseFormData>) {
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: {
        expenseCategory: true,
        payroll: {
          include: {
            employee: {
              include: {
                user: true
              }
            }
          }
        },
        employee: {
          include: {
            user: true
          }
        },
        purchase: {
          include: {
            supplier: true
          }
        }
      }
    })

    return { success: true, expense }
  } catch (error) {
    console.error('Error updating expense:', error)
    return { success: false, error: 'Failed to update expense' }
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting expense:', error)
    return { success: false, error: 'Failed to delete expense' }
  }
}

export async function getExpenseById(id: string) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        expenseCategory: true,
        payroll: {
          include: {
            employee: {
              include: {
                user: true
              }
            }
          }
        },
        employee: {
          include: {
            user: true
          }
        },
        purchase: {
          include: {
            supplier: true
          }
        }
      }
    })

    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, expense }
  } catch (error) {
    console.error('Error fetching expense by ID:', error)
    return { success: false, error: 'Failed to fetch expense' }
  }
}

export async function getExpenses(filters?: {
  categoryId?: string
  type?: ExpenseType
  status?: ExpenseStatus
  dateFrom?: Date
  dateTo?: Date
  employeeId?: string
  limit?: number
}) {
  try {
    const where: any = {}

    if (filters?.categoryId) {
      where.expenseCategoryId = filters.categoryId
    }

    if (filters?.type) {
      where.expenseCategory = {
        type: filters.type
      }
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.expenseDate = {}
      if (filters.dateFrom) where.expenseDate.gte = filters.dateFrom
      if (filters.dateTo) where.expenseDate.lte = filters.dateTo
    }

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        expenseCategory: true,
        payroll: {
          include: {
            employee: {
              include: {
                user: true
              }
            }
          }
        },
        employee: {
          include: {
            user: true
          }
        },
        purchase: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        expenseDate: 'desc'
      },
      take: filters?.limit || 100
    })

    return { success: true, expenses }
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return { success: false, error: 'Failed to fetch expenses' }
  }
}

// Expense Category Management
export async function createExpenseCategory(data: ExpenseCategoryFormData) {
  try {
    const category = await prisma.expenseCategory.create({
      data
    })

    return { success: true, category }
  } catch (error) {
    console.error('Error creating expense category:', error)
    return { success: false, error: 'Failed to create expense category' }
  }
}

export async function getExpenseCategories() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            expenses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, categories }
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return { success: false, error: 'Failed to fetch expense categories' }
  }
}

// Daily Salary Expense Recording (Best Practice for Restaurant Management)
export async function recordDailySalaryExpenses(date: Date) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Check if salary expenses already recorded for this date
    const existingSalaryExpenses = await prisma.expense.findFirst({
      where: {
        expenseDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        expenseCategory: {
          type: 'PAYROLL'
        },
        description: {
          contains: 'Daily salary allocation'
        }
      }
    })

    if (existingSalaryExpenses) {
      return { 
        success: true, 
        message: 'Daily salary expenses already recorded',
        alreadyRecorded: true
      }
    }

    // Get all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        isActive: true
      },
      include: {
        user: true
      }
    })

    if (activeEmployees.length === 0) {
      return { 
        success: true, 
        message: 'No active employees found - no salary expenses to record',
        employeeCount: 0
      }
    }

    // Find or create payroll expense category
    let payrollCategory = await prisma.expenseCategory.findFirst({
      where: {
        type: 'PAYROLL'
      }
    })

    if (!payrollCategory) {
      payrollCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Employee Salaries',
          description: 'Daily employee salary allocations (Monthly salary ÷ 30 days)',
          type: 'PAYROLL'
        }
      })
    }

    // Calculate daily salary allocation (monthly salary / 30 days)
    // This is the restaurant industry standard for daily costing
    let totalDailySalaryExpense = 0
    const salaryExpenses = []

    for (const employee of activeEmployees) {
      const dailySalary = Math.round((employee.salary / 30) * 100) / 100 // Round to 2 decimal places
      totalDailySalaryExpense += dailySalary

      salaryExpenses.push({
        expenseCategoryId: payrollCategory.id,
        description: `Daily salary allocation - ${employee.user.name} (${employee.position})`,
        amount: dailySalary,
        expenseDate: date,
        status: 'APPROVED' as ExpenseStatus
      })
    }

    // Create the expense records in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.expense.createMany({
        data: salaryExpenses
      })
    })

    return { 
      success: true, 
      message: `Daily salary expenses recorded: ${activeEmployees.length} employees, $${totalDailySalaryExpense.toFixed(2)} total`,
      totalAmount: totalDailySalaryExpense,
      employeeCount: activeEmployees.length,
      breakdown: salaryExpenses.map(exp => ({
        employee: exp.description,
        amount: exp.amount
      }))
    }
  } catch (error) {
    console.error('Error recording daily salary expenses:', error)
    return { success: false, error: 'Failed to record daily salary expenses' }
  }
}

// Automated Expense Creation
export async function createPayrollExpense(payrollId: string) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    })

    if (!payroll) {
      return { success: false, error: 'Payroll not found' }
    }

    // Find or create payroll expense category
    let payrollCategory = await prisma.expenseCategory.findFirst({
      where: {
        type: 'PAYROLL',
        name: 'Employee Salaries'
      }
    })

    if (!payrollCategory) {
      payrollCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Employee Salaries',
          description: 'Monthly employee salary payments',
          type: 'PAYROLL'
        }
      })
    }

    const expense = await prisma.expense.create({
      data: {
        expenseCategoryId: payrollCategory.id,
        description: `Salary payment for ${payroll.employee.user.name} - ${new Date(payroll.period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        amount: payroll.totalAmount,
        expenseDate: new Date(),
        payrollId: payroll.id,
        employeeId: payroll.employeeId,
        status: 'APPROVED'
      }
    })

    return { success: true, expense }
  } catch (error) {
    console.error('Error creating payroll expense:', error)
    return { success: false, error: 'Failed to create payroll expense' }
  }
}

export async function createPurchaseExpense(purchaseId: string) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true
      }
    })

    if (!purchase) {
      return { success: false, error: 'Purchase not found' }
    }

    // Find or create stock expense category
    let stockCategory = await prisma.expenseCategory.findFirst({
      where: {
        type: 'STOCK',
        name: 'Inventory Purchases'
      }
    })

    if (!stockCategory) {
      stockCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Inventory Purchases',
          description: 'Cost of goods sold and inventory purchases',
          type: 'STOCK'
        }
      })
    }

    const expense = await prisma.expense.create({
      data: {
        expenseCategoryId: stockCategory.id,
        description: `Stock purchase from ${purchase.supplier.name} - ${purchase.purchaseNumber}`,
        amount: purchase.totalAmount,
        expenseDate: purchase.purchaseDate,
        purchaseId: purchase.id,
        supplierInfo: purchase.supplier.name,
        status: 'APPROVED'
      }
    })

    return { success: true, expense }
  } catch (error) {
    console.error('Error creating purchase expense:', error)
    return { success: false, error: 'Failed to create purchase expense' }
  }
}

// Expense Analytics
export async function getExpenseAnalytics(period: {
  startDate: Date
  endDate: Date
}) {
  try {
    // Total expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['expenseCategoryId'],
      where: {
        expenseDate: {
          gte: period.startDate,
          lte: period.endDate
        },
        status: 'APPROVED'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get category details
    const categories = await prisma.expenseCategory.findMany({
      where: {
        id: {
          in: expensesByCategory.map(e => e.expenseCategoryId)
        }
      }
    })

    const categoryAnalytics = expensesByCategory.map(expense => {
      const category = categories.find(c => c.id === expense.expenseCategoryId)
      return {
        categoryId: expense.expenseCategoryId,
        categoryName: category?.name || 'Unknown',
        categoryType: category?.type || 'OTHER',
        totalAmount: expense._sum.amount || 0,
        expenseCount: expense._count.id
      }
    })

    // Expenses by type
    const expensesByType = await prisma.$queryRaw`
      SELECT 
        ec.type,
        SUM(e.amount)::FLOAT as total_amount,
        COUNT(e.id)::INT as expense_count
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e.expense_date >= ${period.startDate}
        AND e.expense_date <= ${period.endDate}
        AND e.status = 'APPROVED'
      GROUP BY ec.type
      ORDER BY total_amount DESC
    ` as Array<{
      type: ExpenseType
      total_amount: number
      expense_count: number
    }>

    // Monthly trend
    const monthlyTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', e.expense_date) as month,
        SUM(e.amount)::FLOAT as total_amount,
        COUNT(e.id)::INT as expense_count
      FROM expenses e
      WHERE e.expense_date >= ${period.startDate}
        AND e.expense_date <= ${period.endDate}
        AND e.status = 'APPROVED'
      GROUP BY DATE_TRUNC('month', e.expense_date)
      ORDER BY month ASC
    ` as Array<{
      month: Date
      total_amount: number
      expense_count: number
    }>

    // Total summary
    const totalExpenses = categoryAnalytics.reduce((sum, cat) => sum + cat.totalAmount, 0)
    const totalCount = categoryAnalytics.reduce((sum, cat) => sum + cat.expenseCount, 0)

    return {
      success: true,
      analytics: {
        totalExpenses,
        totalCount,
        categoryBreakdown: categoryAnalytics,
        typeBreakdown: expensesByType,
        monthlyTrend: monthlyTrend.map(m => ({
          month: m.month.toISOString().slice(0, 7), // YYYY-MM format
          totalAmount: m.total_amount,
          expenseCount: m.expense_count
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching expense analytics:', error)
    return { success: false, error: 'Failed to fetch expense analytics' }
  }
}

// Recurring Expense Management
async function createRecurringExpenseSchedule(expenseId: string, period: RecurringPeriod, nextDate: Date) {
  // This would be implemented with a background job system
  // For now, we'll just log it
  console.log(`Recurring expense scheduled: ${expenseId}, period: ${period}, next: ${nextDate}`)
}

// Balance Sheet Data
export async function getBalanceSheetData(asOfDate: Date) {
  try {
    // Calculate total expenses up to the date
    const totalExpenses = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          lte: asOfDate
        },
        status: 'APPROVED'
      },
      _sum: {
        amount: true
      }
    })

    // Expenses by type for balance sheet
    const expensesByType = await prisma.$queryRaw`
      SELECT 
        ec.type,
        SUM(e.amount)::FLOAT as total_amount
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e.expense_date <= ${asOfDate}
        AND e.status = 'APPROVED'
      GROUP BY ec.type
    ` as Array<{
      type: ExpenseType
      total_amount: number
    }>

    return {
      success: true,
      balanceSheet: {
        totalExpenses: totalExpenses._sum.amount || 0,
        expensesByType: expensesByType.map(e => ({
          type: e.type,
          amount: e.total_amount
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching balance sheet data:', error)
    return { success: false, error: 'Failed to fetch balance sheet data' }
  }
}

// Initialize Default Expense Categories
export async function initializeExpenseCategories() {
  try {
    const defaultCategories = [
      { name: 'Employee Salaries', description: 'Monthly employee salary payments', type: 'PAYROLL' as ExpenseType },
      { name: 'Inventory Purchases', description: 'Cost of goods sold and inventory purchases', type: 'STOCK' as ExpenseType },
      { name: 'Utilities', description: 'Electricity, water, gas, and internet bills', type: 'UTILITIES' as ExpenseType },
      { name: 'Property Rent', description: 'Monthly restaurant rent payments', type: 'RENT' as ExpenseType },
      { name: 'Equipment Maintenance', description: 'Kitchen equipment repairs and maintenance', type: 'MAINTENANCE' as ExpenseType },
      { name: 'Marketing & Advertising', description: 'Promotional activities and advertising costs', type: 'MARKETING' as ExpenseType },
      { name: 'Business Insurance', description: 'Insurance premiums and coverage costs', type: 'INSURANCE' as ExpenseType },
      { name: 'Government Taxes', description: 'Business taxes and government fees', type: 'TAXES' as ExpenseType },
      { name: 'Office Supplies', description: 'Stationery, cleaning supplies, and office materials', type: 'OPERATIONAL' as ExpenseType },
      { name: 'Transportation', description: 'Delivery costs and transportation expenses', type: 'OPERATIONAL' as ExpenseType }
    ]

    for (const category of defaultCategories) {
      await prisma.expenseCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category
      })
    }

    return { success: true, message: 'Default expense categories initialized' }
  } catch (error) {
    console.error('Error initializing expense categories:', error)
    return { success: false, error: 'Failed to initialize expense categories' }
  }
}
