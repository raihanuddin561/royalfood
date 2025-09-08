import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'last_30_days'

    // Helper function to convert BigInt to Number
    const convertBigIntToNumber = (obj: any): any => {
      if (obj === null || obj === undefined) return obj
      if (typeof obj === 'bigint') return Number(obj)
      if (obj instanceof Date) return obj.toISOString()
      if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
      if (typeof obj === 'object') {
        const converted: any = {}
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigIntToNumber(value)
        }
        return converted
      }
      return obj
    }

    // Calculate date range
    let dateRange = { start: new Date(), end: new Date() }
    
    if (startDate && endDate) {
      dateRange.start = new Date(startDate)
      dateRange.end = new Date(endDate)
    } else {
      const now = new Date()
      switch (period) {
        case 'today':
          dateRange.start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateRange.end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          dateRange.start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          dateRange.end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1)
          break
        case 'this_week':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          dateRange.start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          dateRange.end = now
          break
        case 'this_month':
          dateRange.start = new Date(now.getFullYear(), now.getMonth(), 1)
          dateRange.end = now
          break
        case 'last_30_days':
        default:
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateRange.end = now
          break
      }
    }

    // Set end date to end of day
    dateRange.end = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate(), 23, 59, 59, 999)

    // 1. Sales Summary (Date-wise)
    const salesSummary = await prisma.$queryRaw`
      SELECT 
        DATE(s."saleDate") as date,
        COUNT(s.id) as transaction_count,
        SUM(s."totalAmount") as total_revenue,
        SUM(s."discountAmount") as total_discounts,
        SUM(s."finalAmount") as final_amount,
        AVG(s."totalAmount") as avg_transaction_value,
        COUNT(CASE WHEN s."paymentMethod" = 'CASH' THEN 1 END) as cash_transactions,
        COUNT(CASE WHEN s."paymentMethod" = 'CARD' THEN 1 END) as card_transactions,
        COUNT(CASE WHEN s."paymentMethod" = 'DIGITAL_WALLET' THEN 1 END) as digital_transactions,
        SUM(CASE WHEN s."paymentMethod" = 'CASH' THEN s."finalAmount" ELSE 0 END) as cash_amount,
        SUM(CASE WHEN s."paymentMethod" = 'CARD' THEN s."finalAmount" ELSE 0 END) as card_amount,
        SUM(CASE WHEN s."paymentMethod" = 'DIGITAL_WALLET' THEN s."finalAmount" ELSE 0 END) as digital_amount
      FROM sales s
      WHERE s."saleDate" >= ${dateRange.start}
        AND s."saleDate" <= ${dateRange.end}
        AND s.status = 'COMPLETED'
      GROUP BY DATE(s."saleDate")
      ORDER BY DATE(s."saleDate") DESC
    ` as Array<{
      date: Date
      transaction_count: number
      total_revenue: number
      total_discounts: number
      final_amount: number
      avg_transaction_value: number
      cash_transactions: number
      card_transactions: number
      digital_transactions: number
      cash_amount: number
      card_amount: number
      digital_amount: number
    }>

    // 2. Purchase Summary (Date-wise)
    const purchaseSummary = await prisma.$queryRaw`
      SELECT 
        DATE(p."purchaseDate") as date,
        COUNT(p.id) as purchase_count,
        SUM(p."totalAmount") as total_purchase_amount,
        0 as total_paid,
        SUM(p."totalAmount") as outstanding_amount,
        COUNT(CASE WHEN p.status = 'RECEIVED' THEN 1 END) as completed_purchases,
        COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pending_purchases,
        STRING_AGG(DISTINCT s.name, ', ') as suppliers
      FROM purchases p
      LEFT JOIN suppliers s ON p."supplierId" = s.id
      WHERE p."purchaseDate" >= ${dateRange.start}
        AND p."purchaseDate" <= ${dateRange.end}
      GROUP BY DATE(p."purchaseDate")
      ORDER BY DATE(p."purchaseDate") DESC
    ` as Array<{
      date: Date
      purchase_count: number
      total_purchase_amount: number
      total_paid: number
      outstanding_amount: number
      completed_purchases: number
      pending_purchases: number
      suppliers: string
    }>

    // 3. Stock Usage Summary (Date-wise)
    const stockUsageSummary = await prisma.$queryRaw`
      SELECT 
        DATE(su."usageDate") as date,
        COUNT(su.id) as usage_entries,
        SUM(su.quantity) as total_quantity_used,
        SUM(su."totalCost") as total_usage_cost,
        COUNT(CASE WHEN su.reason = 'PRODUCTION' THEN 1 END) as production_entries,
        COUNT(CASE WHEN su.reason = 'WASTE' THEN 1 END) as waste_entries,
        COUNT(CASE WHEN su.reason = 'SAMPLE' THEN 1 END) as sample_entries,
        SUM(CASE WHEN su.reason = 'PRODUCTION' THEN su."totalCost" ELSE 0 END) as production_cost,
        SUM(CASE WHEN su.reason = 'WASTE' THEN su."totalCost" ELSE 0 END) as waste_cost,
        SUM(CASE WHEN su.reason = 'SAMPLE' THEN su."totalCost" ELSE 0 END) as sample_cost,
        STRING_AGG(DISTINCT i.name, ', ') as items_used
      FROM stock_usage su
      JOIN items i ON su."itemId" = i.id
      WHERE su."usageDate" >= ${dateRange.start}
        AND su."usageDate" <= ${dateRange.end}
      GROUP BY DATE(su."usageDate")
      ORDER BY DATE(su."usageDate") DESC
    ` as Array<{
      date: Date
      usage_entries: number
      total_quantity_used: number
      total_usage_cost: number
      production_entries: number
      waste_entries: number
      sample_entries: number
      production_cost: number
      waste_cost: number
      sample_cost: number
      items_used: string
    }>

    // 4. Expense Summary (Date-wise)
    const expenseSummary = await prisma.$queryRaw`
      SELECT 
        DATE(e."expenseDate") as date,
        COUNT(e.id) as expense_count,
        SUM(e.amount) as total_expenses,
        SUM(CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END) as payroll_expenses,
        SUM(CASE WHEN ec.type = 'UTILITIES' THEN e.amount ELSE 0 END) as utilities_expenses,
        SUM(CASE WHEN ec.type = 'RENT' THEN e.amount ELSE 0 END) as rent_expenses,
        SUM(CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END) as operational_expenses,
        SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END) as stock_expenses,
        SUM(CASE WHEN ec.type IN ('MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') THEN e.amount ELSE 0 END) as other_expenses,
        COUNT(CASE WHEN e.status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN e.status = 'PAID' THEN 1 END) as paid_count,
        COUNT(CASE WHEN e.status = 'PENDING' THEN 1 END) as pending_count
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e."expenseDate" >= ${dateRange.start}
        AND e."expenseDate" <= ${dateRange.end}
      GROUP BY DATE(e."expenseDate")
      ORDER BY DATE(e."expenseDate") DESC
    ` as Array<{
      date: Date
      expense_count: number
      total_expenses: number
      payroll_expenses: number
      utilities_expenses: number
      rent_expenses: number
      operational_expenses: number
      stock_expenses: number
      other_expenses: number
      approved_count: number
      paid_count: number
      pending_count: number
    }>

    // 5. Inventory Summary (Current status + movements)
    const inventorySummary = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.name,
        i."currentStock",
        i."reorderLevel",
        i."costPrice",
        i."sellingPrice",
        (i."currentStock" * i."costPrice") as inventory_value,
        (i."currentStock" * i."sellingPrice") as potential_revenue,
        c.name as category,
        CASE 
          WHEN i."currentStock" <= 0 THEN 'OUT_OF_STOCK'
          WHEN i."currentStock" <= i."reorderLevel" THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM items i
      JOIN categories c ON i."categoryId" = c.id
      WHERE i."isActive" = true
      ORDER BY 
        CASE 
          WHEN i."currentStock" <= 0 THEN 1
          WHEN i."currentStock" <= i."reorderLevel" THEN 2
          ELSE 3
        END,
        i.name
    ` as Array<{
      id: string
      name: string
      currentStock: number
      reorderLevel: number
      costPrice: number
      sellingPrice: number
      inventory_value: number
      potential_revenue: number
      category: string
      stock_status: string
    }>

    // 6. Daily Profit Analysis
    const profitAnalysis = await prisma.$queryRaw`
      WITH daily_data AS (
        SELECT 
          date_series.date,
          COALESCE(sales_data.revenue, 0) as revenue,
          COALESCE(sales_data.transaction_count, 0) as transactions,
          COALESCE(usage_data.cogs, 0) as cogs,
          COALESCE(expense_data.expenses, 0) as expenses
        FROM (
          SELECT DATE(generate_series(${dateRange.start}::date, ${dateRange.end}::date, '1 day'::interval)) as date
        ) date_series
        LEFT JOIN (
          SELECT 
            DATE(s."saleDate") as date,
            SUM(s."finalAmount") as revenue,
            COUNT(s.id) as transaction_count
          FROM sales s
          WHERE s.status = 'COMPLETED'
          GROUP BY DATE(s."saleDate")
        ) sales_data ON sales_data.date = date_series.date
        LEFT JOIN (
          SELECT 
            DATE(su."usageDate") as date,
            SUM(su."totalCost") as cogs
          FROM stock_usage su
          WHERE su.reason = 'PRODUCTION'
          GROUP BY DATE(su."usageDate")
        ) usage_data ON usage_data.date = date_series.date
        LEFT JOIN (
          SELECT 
            DATE(e."expenseDate") as date,
            SUM(e.amount) as expenses
          FROM expenses e
          JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
          WHERE ec.type != 'STOCK' AND e.status IN ('APPROVED', 'PAID')
          GROUP BY DATE(e."expenseDate")
        ) expense_data ON expense_data.date = date_series.date
      )
      SELECT 
        date,
        revenue,
        transactions,
        cogs,
        expenses,
        (revenue - cogs - expenses) as net_profit,
        CASE 
          WHEN revenue > 0 THEN ((revenue - cogs) / revenue * 100)
          ELSE 0 
        END as gross_margin,
        CASE 
          WHEN revenue > 0 THEN ((revenue - cogs - expenses) / revenue * 100)
          ELSE 0 
        END as net_margin
      FROM daily_data
      WHERE date >= ${dateRange.start}::date AND date <= ${dateRange.end}::date
      ORDER BY date DESC
    ` as Array<{
      date: Date
      revenue: number
      transactions: number
      cogs: number
      expenses: number
      net_profit: number
      gross_margin: number
      net_margin: number
    }>

    // 7. Summary Totals - Convert BigInt values
    const convertedSalesSummary = convertBigIntToNumber(salesSummary)
    const convertedPurchaseSummary = convertBigIntToNumber(purchaseSummary)
    const convertedExpenseSummary = convertBigIntToNumber(expenseSummary)
    const convertedStockUsageSummary = convertBigIntToNumber(stockUsageSummary)
    const convertedProfitAnalysis = convertBigIntToNumber(profitAnalysis)
    const convertedInventorySummary = convertBigIntToNumber(inventorySummary)

    const totalSales = convertedSalesSummary.reduce((sum: number, day: any) => sum + Number(day.final_amount || 0), 0)
    const totalPurchases = convertedPurchaseSummary.reduce((sum: number, day: any) => sum + Number(day.total_purchase_amount || 0), 0)
    const totalExpenses = convertedExpenseSummary.reduce((sum: number, day: any) => sum + Number(day.total_expenses || 0), 0)
    const totalUsageCost = convertedStockUsageSummary.reduce((sum: number, day: any) => sum + Number(day.total_usage_cost || 0), 0)
    const totalProfit = convertedProfitAnalysis.reduce((sum: number, day: any) => sum + Number(day.net_profit || 0), 0)
    const totalInventoryValue = convertedInventorySummary.reduce((sum: number, item: any) => sum + Number(item.inventory_value || 0), 0)

    const outOfStockItems = convertedInventorySummary.filter((item: any) => item.stock_status === 'OUT_OF_STOCK').length
    const lowStockItems = convertedInventorySummary.filter((item: any) => item.stock_status === 'LOW_STOCK').length

    return NextResponse.json({
      success: true,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        period: period
      },
      summary: {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalUsageCost,
        totalProfit,
        totalInventoryValue,
        profitMargin: totalSales > 0 ? (totalProfit / totalSales * 100) : 0,
        outOfStockItems,
        lowStockItems,
        totalTransactions: convertedSalesSummary.reduce((sum: number, day: any) => sum + Number(day.transaction_count || 0), 0),
        avgTransactionValue: totalSales > 0 ? totalSales / convertedSalesSummary.reduce((sum: number, day: any) => sum + Number(day.transaction_count || 0), 0) : 0
      },
      dailyData: {
        sales: convertedSalesSummary,
        purchases: convertedPurchaseSummary,
        stockUsage: convertedStockUsageSummary,
        expenses: convertedExpenseSummary,
        profits: convertedProfitAnalysis
      },
      inventory: convertedInventorySummary
    })

  } catch (error) {
    console.error('Summary API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
