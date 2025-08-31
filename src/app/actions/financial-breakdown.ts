import { PrismaClient } from '@prisma/client'

export type ExpenseBreakdown = {
  totalRecordedExpenses: number
  recordedStockPurchases: number
  payrollExpenses: number
  operationalExpenses: number
  otherExpenses: number
  cogs: number
  effectiveTotalExpenses: number
}

/**
 * Compute expense breakdown for a given date range.
 * prismaClient is injected to allow unit testing with a mock.
 */
export async function computeExpenseBreakdown(
  prismaClient: Pick<PrismaClient, '$queryRaw'>,
  startDate: Date,
  endDate: Date
): Promise<ExpenseBreakdown> {
  // Ensure endDate covers the full day
  const endOfDay = new Date(endDate)
  endOfDay.setHours(23, 59, 59, 999)

  const expensesAgg = await prismaClient.$queryRaw`
    SELECT 
      SUM(e.amount)::FLOAT as total_expenses,
      SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END)::FLOAT as stock_expenses,
      SUM(CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END)::FLOAT as payroll_expenses,
      SUM(CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END)::FLOAT as operational_expenses,
      SUM(CASE WHEN ec.type IN ('UTILITIES', 'RENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') THEN e.amount ELSE 0 END)::FLOAT as other_expenses
    FROM expenses e
    JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
    WHERE e."expenseDate" >= ${startDate}
      AND e."expenseDate" <= ${endOfDay}
      AND e.status IN ('APPROVED', 'PAID')
  ` as Array<any>

  const cogsAgg = await prismaClient.$queryRaw`
    SELECT SUM(ABS(il.quantity) * i."costPrice")::FLOAT as total_cogs
    FROM inventory_logs il
    JOIN items i ON il."itemId" = i.id
    WHERE il."createdAt" >= ${startDate}
      AND il."createdAt" <= ${endOfDay}
      AND il.type = 'STOCK_OUT'
      AND il.reason ILIKE '%Sale%'
  ` as Array<any>

  const totalExpensesRecorded = expensesAgg[0]?.total_expenses || 0
  const stockExpensesRecorded = expensesAgg[0]?.stock_expenses || 0
  const payrollExpenses = expensesAgg[0]?.payroll_expenses || 0
  const operationalExpenses = expensesAgg[0]?.operational_expenses || 0
  const otherExpenses = expensesAgg[0]?.other_expenses || 0
  const cogsAmount = cogsAgg[0]?.total_cogs || 0

  const effectiveTotalExpenses = totalExpensesRecorded - stockExpensesRecorded + cogsAmount

  return {
    totalRecordedExpenses: totalExpensesRecorded,
    recordedStockPurchases: stockExpensesRecorded,
    payrollExpenses,
    operationalExpenses,
    otherExpenses,
    cogs: cogsAmount,
    effectiveTotalExpenses
  }
}

export default computeExpenseBreakdown

/**
 * Compute daily series of expense breakdown between startDate and endDate (inclusive).
 * Returns an array of per-day breakdown objects (date ISO YYYY-MM-DD and expense fields).
 */
export async function computeExpenseBreakdownSeries(
  prismaClient: Pick<PrismaClient, '$queryRaw'>,
  startDate: Date,
  endDate: Date
) {
  const endOfDay = new Date(endDate)
  endOfDay.setHours(23, 59, 59, 999)

  // Expenses aggregated by date
  const expensesByDate = await prismaClient.$queryRaw`
    SELECT 
      DATE(e."expenseDate") as date,
      SUM(e.amount)::FLOAT as total_expenses,
      SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END)::FLOAT as stock_expenses,
      SUM(CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END)::FLOAT as payroll_expenses,
      SUM(CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END)::FLOAT as operational_expenses,
      SUM(CASE WHEN ec.type IN ('UTILITIES', 'RENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') THEN e.amount ELSE 0 END)::FLOAT as other_expenses
    FROM expenses e
    JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
    WHERE e."expenseDate" >= ${startDate}
      AND e."expenseDate" <= ${endOfDay}
      AND e.status IN ('APPROVED', 'PAID')
    GROUP BY DATE(e."expenseDate")
    ORDER BY DATE(e."expenseDate") ASC
  ` as Array<any>

  const cogsByDate = await prismaClient.$queryRaw`
    SELECT DATE(il."createdAt") as date, SUM(ABS(il.quantity) * i."costPrice")::FLOAT as total_cogs
    FROM inventory_logs il
    JOIN items i ON il."itemId" = i.id
    WHERE il."createdAt" >= ${startDate}
      AND il."createdAt" <= ${endOfDay}
      AND il.type = 'STOCK_OUT'
      AND il.reason ILIKE '%Sale%'
    GROUP BY DATE(il."createdAt")
    ORDER BY DATE(il."createdAt") ASC
  ` as Array<any>

  // Map results by date string (YYYY-MM-DD)
  const expMap: Record<string, any> = {}
  for (const r of expensesByDate) {
    const key = new Date(r.date).toISOString().split('T')[0]
    expMap[key] = {
      total_expenses: r.total_expenses || 0,
      stock_expenses: r.stock_expenses || 0,
      payroll_expenses: r.payroll_expenses || 0,
      operational_expenses: r.operational_expenses || 0,
      other_expenses: r.other_expenses || 0
    }
  }

  const cogsMap: Record<string, number> = {}
  for (const c of cogsByDate) {
    const key = new Date(c.date).toISOString().split('T')[0]
    cogsMap[key] = c.total_cogs || 0
  }

  // Build full range of dates
  const out: Array<any> = []
  const cur = new Date(startDate)
  cur.setHours(0, 0, 0, 0)
  const last = new Date(endDate)
  last.setHours(0, 0, 0, 0)

  while (cur <= last) {
    const key = cur.toISOString().split('T')[0]
    const exp = expMap[key] || { total_expenses: 0, stock_expenses: 0, payroll_expenses: 0, operational_expenses: 0, other_expenses: 0 }
    const cogs = cogsMap[key] || 0
    const effective = (exp.total_expenses || 0) - (exp.stock_expenses || 0) + cogs

    out.push({
      date: key,
      total_expenses: exp.total_expenses || 0,
      stock_expenses: exp.stock_expenses || 0,
      payroll_expenses: exp.payroll_expenses || 0,
      operational_expenses: exp.operational_expenses || 0,
      other_expenses: exp.other_expenses || 0,
      cogs,
      effectiveTotalExpenses: effective
    })

    cur.setDate(cur.getDate() + 1)
  }

  return out
}
