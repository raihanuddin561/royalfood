'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Interface for creating a daily sale with multiple items
interface SaleItemData {
  itemId: string
  quantity: number
  sellingPrice?: number // Optional override of item's default selling price
}

interface CreateDailySaleData {
  items: SaleItemData[]
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER'
  discountAmount?: number
  notes?: string
  saleDate?: Date
}

// Generate sale number
function generateSaleNumber(): string {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = Date.now().toString().slice(-6)
  return `SALE-${dateStr}-${timeStr}`
}

// Create daily sales with multiple items
export async function createDailySale(data: CreateDailySaleData) {
  try {
    // Validation
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        message: 'At least one item is required for the sale'
      }
    }

    if (!data.paymentMethod) {
      return {
        success: false,
        message: 'Payment method is required'
      }
    }

    // Validate all items exist and have sufficient stock
    const itemIds = data.items.map(item => item.itemId)
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        isActive: true
      }
    })

    if (items.length !== itemIds.length) {
      return {
        success: false,
        message: 'One or more items not found or inactive'
      }
    }

    // Check stock availability
    for (const saleItem of data.items) {
      const item = items.find(i => i.id === saleItem.itemId)
      if (!item) continue

      if (item.currentStock < saleItem.quantity) {
        return {
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${item.currentStock}, Required: ${saleItem.quantity}`
        }
      }

      if (saleItem.quantity <= 0) {
        return {
          success: false,
          message: `Invalid quantity for ${item.name}. Quantity must be greater than 0`
        }
      }
    }

    // Get admin user for logs
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return {
        success: false,
        message: 'No admin user found. Please contact system administrator.'
      }
    }

    // Calculate totals
    let totalAmount = 0
    let totalCostPrice = 0

    const saleItemsWithPrices = data.items.map(saleItem => {
      const item = items.find(i => i.id === saleItem.itemId)!
      const sellingPrice = saleItem.sellingPrice || item.sellingPrice || item.costPrice * 1.3 // 30% markup default
      const itemTotal = sellingPrice * saleItem.quantity
      const itemCost = item.costPrice * saleItem.quantity

      totalAmount += itemTotal
      totalCostPrice += itemCost

      return {
        ...saleItem,
        sellingPrice,
        totalPrice: itemTotal,
        costPrice: item.costPrice,
        totalCost: itemCost,
        item
      }
    })

    const discountAmount = data.discountAmount || 0
    const finalAmount = Math.max(0, totalAmount - discountAmount)
    const grossProfit = finalAmount - totalCostPrice

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          saleNumber: generateSaleNumber(),
          userId: adminUser.id,
          saleDate: data.saleDate || new Date(),
          totalAmount,
          discountAmount,
          finalAmount,
          paymentMethod: data.paymentMethod,
          status: 'COMPLETED',
          notes: data.notes || null
        }
      })

      // Create individual item sales (we'll extend schema for this)
      const inventoryLogs = []
      const stockUpdates = []

      for (const saleItem of saleItemsWithPrices) {
        // Update item stock
        stockUpdates.push(
          tx.item.update({
            where: { id: saleItem.itemId },
            data: {
              currentStock: {
                decrement: saleItem.quantity
              },
              updatedAt: new Date()
            }
          })
        )

        // Create inventory log for stock reduction
        inventoryLogs.push(
          tx.inventoryLog.create({
            data: {
              itemId: saleItem.itemId,
              userId: adminUser.id,
              type: 'STOCK_OUT',
              quantity: -Math.abs(saleItem.quantity), // Negative for stock out
              previousStock: saleItem.item.currentStock,
              newStock: saleItem.item.currentStock - saleItem.quantity,
              reason: `Sale - ${sale.saleNumber}`,
              reference: sale.id
            }
          })
        )
      }

      // Execute all updates
      await Promise.all([...stockUpdates, ...inventoryLogs])

      return {
        sale,
        itemsSold: saleItemsWithPrices.length,
        totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
        grossProfit
      }
    })

    // Revalidate pages
    revalidatePath('/sales')
    revalidatePath('/sales/daily')
    revalidatePath('/inventory')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Sale recorded successfully! ${result.itemsSold} items, ${result.totalQuantity} total quantity, ${finalAmount.toFixed(2)} BDT revenue, ${result.grossProfit.toFixed(2)} BDT profit`,
      data: {
        saleId: result.sale.id,
        saleNumber: result.sale.saleNumber,
        finalAmount,
        grossProfit: result.grossProfit,
        itemsSold: result.itemsSold
      }
    }
  } catch (error) {
    console.error('Create daily sale error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record sale'
    }
  }
}

// Create quick sale with total amount (to be allocated)
export async function createQuickSale(formData: FormData) {
  try {
    const totalAmount = parseFloat(formData.get('totalAmount') as string)
    const paymentMethod = formData.get('paymentMethod') as string
    const notes = formData.get('notes') as string

    // Validation
    if (!totalAmount || totalAmount <= 0) {
      return {
        success: false,
        message: 'Total amount must be greater than 0'
      }
    }

    if (!paymentMethod) {
      return {
        success: false,
        message: 'Payment method is required'
      }
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return {
        success: false,
        message: 'No admin user found'
      }
    }

    // Create sale record (without specific items - general sale)
    const sale = await prisma.sale.create({
      data: {
        saleNumber: generateSaleNumber(),
        userId: adminUser.id,
        saleDate: new Date(),
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        paymentMethod: paymentMethod as any,
        status: 'COMPLETED',
        notes: notes || 'Quick sale - total amount entry'
      }
    })

    // Revalidate pages
    revalidatePath('/sales')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Quick sale recorded successfully! ${totalAmount.toFixed(2)} BDT`,
      data: {
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        finalAmount: totalAmount
      }
    }
  } catch (error) {
    console.error('Create quick sale error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record quick sale'
    }
  }
}

// Get daily sales data with item breakdown
export async function getDailySalesData(date?: Date) {
  try {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get sales for the day
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'COMPLETED'
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get inventory logs for item-level sales data
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        type: 'STOCK_OUT',
        reason: {
          contains: 'Sale'
        }
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            costPrice: true,
            sellingPrice: true
          }
        }
      }
    })

    // Calculate item-wise sales summary
    const itemSummary = inventoryLogs.reduce((acc, log) => {
      const itemId = log.itemId
      const quantity = Math.abs(log.quantity)
      const costPrice = log.item.costPrice
      const sellingPrice = log.item.sellingPrice || costPrice * 1.3

      if (!acc[itemId]) {
        acc[itemId] = {
          itemName: log.item.name,
          unit: log.item.unit,
          costPrice,
          sellingPrice,
          quantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          profit: 0
        }
      }

      acc[itemId].quantitySold += quantity
      acc[itemId].totalRevenue += quantity * sellingPrice
      acc[itemId].totalCost += quantity * costPrice
      acc[itemId].profit = acc[itemId].totalRevenue - acc[itemId].totalCost

      return acc
    }, {} as Record<string, any>)

    // Calculate daily totals
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0)
    const totalCost = Object.values(itemSummary).reduce((sum: number, item: any) => sum + item.totalCost, 0)
    const totalProfit = totalRevenue - totalCost

    return {
      success: true,
      data: {
        date: targetDate,
        sales,
        itemSummary: Object.values(itemSummary),
        totals: {
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalProfit,
          salesCount: sales.length
        }
      }
    }
  } catch (error) {
    console.error('Get daily sales data error:', error)
    return {
      success: false,
      message: 'Failed to fetch daily sales data'
    }
  }
}

// Delete/refund a sale
export async function refundSale(saleId: string, reason?: string) {
  try {
    if (!saleId) {
      return {
        success: false,
        message: 'Sale ID is required'
      }
    }

    // Get the sale with related inventory logs
    const sale = await prisma.sale.findUnique({
      where: { id: saleId }
    })

    if (!sale) {
      return {
        success: false,
        message: 'Sale not found'
      }
    }

    if (sale.status === 'REFUNDED') {
      return {
        success: false,
        message: 'Sale is already refunded'
      }
    }

    // Get related inventory logs
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        reference: saleId,
        type: 'STOCK_OUT'
      },
      include: {
        item: true
      }
    })

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return {
        success: false,
        message: 'No admin user found'
      }
    }

    // Use transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Update sale status to refunded
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'REFUNDED',
          notes: `${sale.notes || ''} | REFUNDED: ${reason || 'No reason provided'}`,
          updatedAt: new Date()
        }
      })

      // Reverse inventory changes
      for (const log of inventoryLogs) {
        const quantity = Math.abs(log.quantity)

        // Add stock back to inventory
        await tx.item.update({
          where: { id: log.itemId },
          data: {
            currentStock: {
              increment: quantity
            },
            updatedAt: new Date()
          }
        })

        // Create reversal inventory log
        await tx.inventoryLog.create({
          data: {
            itemId: log.itemId,
            userId: adminUser.id,
            type: 'STOCK_IN',
            quantity: quantity, // Positive for stock in
            previousStock: log.item.currentStock,
            newStock: log.item.currentStock + quantity,
            reason: `Refund - ${sale.saleNumber}`,
            reference: saleId
          }
        })
      }
    })

    // Revalidate pages
    revalidatePath('/sales')
    revalidatePath('/sales/daily')
    revalidatePath('/inventory')

    return {
      success: true,
      message: `Sale ${sale.saleNumber} refunded successfully. Stock restored.`
    }
  } catch (error) {
    console.error('Refund sale error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to refund sale'
    }
  }
}

// Get available items for sales
export async function getAvailableItems() {
  try {
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
        currentStock: {
          gt: 0
        }
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      success: true,
      data: items.map(item => ({
        id: item.id,
        name: item.name,
        categoryName: item.category?.name || 'Uncategorized',
        unit: item.unit,
        currentStock: item.currentStock,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice || item.costPrice * 1.3,
        profitMargin: item.sellingPrice 
          ? ((item.sellingPrice - item.costPrice) / item.sellingPrice * 100)
          : 30 // Default 30% margin
      }))
    }
  } catch (error) {
    console.error('Get available items error:', error)
    return {
      success: false,
      message: 'Failed to fetch available items'
    }
  }
}

// Helper function to get date ranges
function getDateRange(period: string) {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  switch (period) {
    case 'today':
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setDate(endDate.getDate() - 1)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'this_week':
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      startDate = startOfWeek
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'last_week':
      const lastWeekEnd = new Date(now)
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1)
      lastWeekEnd.setHours(23, 59, 59, 999)
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
      lastWeekStart.setHours(0, 0, 0, 0)
      startDate = lastWeekStart
      endDate = lastWeekEnd
      break
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      endDate.setHours(23, 59, 59, 999)
      break
    default:
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
  }

  return { startDate, endDate }
}

// Get daily profit analysis with item breakdown
export async function getDailyProfitAnalysis(period: string = 'today') {
  try {
    const { startDate, endDate } = getDateRange(period)

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    // Get inventory logs for item-level analysis
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        type: 'STOCK_OUT',
        reason: {
          contains: 'Sale'
        }
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            costPrice: true,
            sellingPrice: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Group sales by date for daily analysis
    const dailyGroups = sales.reduce((acc, sale) => {
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          sales: [],
          revenue: 0,
          salesCount: 0
        }
      }
      acc[dateKey].sales.push(sale)
      acc[dateKey].revenue += sale.finalAmount
      acc[dateKey].salesCount += 1
      return acc
    }, {} as Record<string, any>)

    // Group inventory logs by date and item for cost calculation
    const itemSalesData = inventoryLogs.reduce((acc, log) => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      const itemKey = `${dateKey}-${log.itemId}`
      const quantity = Math.abs(log.quantity)
      const costPrice = log.item.costPrice
      const sellingPrice = log.item.sellingPrice || costPrice * 1.3

      if (!acc[itemKey]) {
        acc[itemKey] = {
          itemId: log.itemId,
          itemName: log.item.name,
          category: log.item.category?.name || 'Uncategorized',
          unit: log.item.unit,
          date: dateKey,
          quantitySold: 0,
          costPrice,
          sellingPrice,
          totalCost: 0,
          revenue: 0
        }
      }

      acc[itemKey].quantitySold += quantity
      acc[itemKey].totalCost += quantity * costPrice
      acc[itemKey].revenue += quantity * sellingPrice

      return acc
    }, {} as Record<string, any>)

    // Calculate daily data with costs
    const dailyData = Object.values(dailyGroups).map((day: any) => {
      const dayItems = Object.values(itemSalesData).filter((item: any) => item.date === day.date)
      const totalCost = dayItems.reduce((sum: number, item: any) => sum + item.totalCost, 0)
      const itemsSold = dayItems.reduce((sum: number, item: any) => sum + item.quantitySold, 0)
      const profit = day.revenue - totalCost
      const profitMargin = day.revenue > 0 ? (profit / day.revenue) * 100 : 0

      return {
        date: day.date,
        revenue: day.revenue,
        cost: totalCost,
        profit,
        profitMargin,
        salesCount: day.salesCount,
        itemsSold
      }
    })

    // Prepare item-level analysis
    const itemAnalysis = Object.values(itemSalesData).map((item: any) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
      cost: item.totalCost,
      profit: item.revenue - item.totalCost,
      profitMargin: item.revenue > 0 ? ((item.revenue - item.totalCost) / item.revenue) * 100 : 0,
      averagePrice: item.quantitySold > 0 ? item.revenue / item.quantitySold : 0
    }))

    return {
      success: true,
      data: {
        daily: dailyData,
        items: itemAnalysis,
        period,
        startDate,
        endDate
      }
    }
  } catch (error) {
    console.error('Get daily profit analysis error:', error)
    return {
      success: false,
      message: 'Failed to fetch profit analysis'
    }
  }
}

// Get category-wise profit analysis
export async function getCategoryProfitAnalysis(period: string = 'today') {
  try {
    const { startDate, endDate } = getDateRange(period)

    // Get inventory logs grouped by category
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        type: 'STOCK_OUT',
        reason: {
          contains: 'Sale'
        }
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            costPrice: true,
            sellingPrice: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Group by category
    const categoryGroups = inventoryLogs.reduce((acc, log) => {
      const categoryName = log.item.category?.name || 'Uncategorized'
      const quantity = Math.abs(log.quantity)
      const costPrice = log.item.costPrice
      const sellingPrice = log.item.sellingPrice || costPrice * 1.3

      if (!acc[categoryName]) {
        acc[categoryName] = {
          categoryName,
          items: new Set(),
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0
        }
      }

      acc[categoryName].items.add(log.itemId)
      acc[categoryName].totalQuantity += quantity
      acc[categoryName].totalRevenue += quantity * sellingPrice
      acc[categoryName].totalCost += quantity * costPrice

      return acc
    }, {} as Record<string, any>)

    // Calculate category analysis
    const categoryAnalysis = Object.values(categoryGroups).map((category: any) => {
      const totalProfit = category.totalRevenue - category.totalCost
      const profitMargin = category.totalRevenue > 0 ? (totalProfit / category.totalRevenue) * 100 : 0

      return {
        categoryName: category.categoryName,
        itemCount: category.items.size,
        totalQuantity: category.totalQuantity,
        totalRevenue: category.totalRevenue,
        totalCost: category.totalCost,
        totalProfit,
        profitMargin
      }
    })

    return {
      success: true,
      data: categoryAnalysis
    }
  } catch (error) {
    console.error('Get category profit analysis error:', error)
    return {
      success: false,
      message: 'Failed to fetch category analysis'
    }
  }
}

// Get monthly profit trends for charts
export async function getMonthlyProfitTrends(months: number = 6) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      }
    })

    // Get inventory logs for cost calculation
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        type: 'STOCK_OUT',
        reason: {
          contains: 'Sale'
        }
      },
      include: {
        item: {
          select: {
            costPrice: true,
            sellingPrice: true
          }
        }
      }
    })

    // Group by month
    const monthlyData = sales.reduce((acc, sale) => {
      const monthKey = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          revenue: 0,
          salesCount: 0
        }
      }
      acc[monthKey].revenue += sale.finalAmount
      acc[monthKey].salesCount += 1
      return acc
    }, {} as Record<string, any>)

    // Calculate costs by month
    const monthlyCosts = inventoryLogs.reduce((acc, log) => {
      const monthKey = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, '0')}`
      const quantity = Math.abs(log.quantity)
      const cost = quantity * log.item.costPrice

      if (!acc[monthKey]) {
        acc[monthKey] = 0
      }
      acc[monthKey] += cost
      return acc
    }, {} as Record<string, number>)

    // Combine data
    const trends = Object.values(monthlyData).map((month: any) => {
      const cost = monthlyCosts[month.month] || 0
      const profit = month.revenue - cost
      const profitMargin = month.revenue > 0 ? (profit / month.revenue) * 100 : 0

      return {
        month: month.month,
        revenue: month.revenue,
        cost,
        profit,
        profitMargin,
        salesCount: month.salesCount
      }
    }).sort((a, b) => a.month.localeCompare(b.month))

    return {
      success: true,
      data: trends
    }
  } catch (error) {
    console.error('Get monthly profit trends error:', error)
    return {
      success: false,
      message: 'Failed to fetch profit trends'
    }
  }
}

// Comprehensive Profit Analysis with Expense Integration
export async function getComprehensiveProfitAnalysis(period: string = 'today') {
  try {
    const { startDate, endDate } = getDateRange(period)

    // Get sales data with detailed breakdown
    const salesData = await prisma.$queryRaw`
      SELECT 
        DATE(s.sale_date) as date,
        COUNT(s.id)::INT as total_sales,
        SUM(s.final_amount)::FLOAT as total_revenue,
        SUM(
          CASE WHEN s.payment_method = 'CASH' THEN s.final_amount ELSE 0 END
        )::FLOAT as cash_sales,
        SUM(
          CASE WHEN s.payment_method = 'CARD' THEN s.final_amount ELSE 0 END
        )::FLOAT as card_sales,
        SUM(
          CASE WHEN s.payment_method = 'DIGITAL_WALLET' THEN s.final_amount ELSE 0 END
        )::FLOAT as digital_wallet_sales,
        SUM(
          CASE WHEN s.payment_method = 'BANK_TRANSFER' THEN s.final_amount ELSE 0 END
        )::FLOAT as bank_transfer_sales,
        SUM(s.discount_amount)::FLOAT as total_discounts
      FROM sales s
      WHERE s.sale_date >= ${startDate}
        AND s.sale_date < ${endDate}
        AND s.status = 'COMPLETED'
      GROUP BY DATE(s.sale_date)
      ORDER BY DATE(s.sale_date) DESC
    ` as Array<{
      date: Date
      total_sales: number
      total_revenue: number
      cash_sales: number
      card_sales: number
      digital_wallet_sales: number
      bank_transfer_sales: number
      total_discounts: number
    }>

    // Get expense data for the same period
    const expenseData = await prisma.$queryRaw`
      SELECT 
        DATE(e.expense_date) as date,
        SUM(e.amount)::FLOAT as total_expenses,
        SUM(
          CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END
        )::FLOAT as stock_expenses,
        SUM(
          CASE WHEN ec.type = 'PAYROLL' THEN e.amount ELSE 0 END
        )::FLOAT as payroll_expenses,
        SUM(
          CASE WHEN ec.type = 'OPERATIONAL' THEN e.amount ELSE 0 END
        )::FLOAT as operational_expenses,
        SUM(
          CASE WHEN ec.type IN ('UTILITIES', 'RENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'MARKETING', 'OTHER') 
               THEN e.amount ELSE 0 END
        )::FLOAT as other_expenses
      FROM expenses e
      JOIN expense_categories ec ON e.expense_category_id = ec.id
      WHERE e.expense_date >= ${startDate}
        AND e.expense_date < ${endDate}
        AND e.status IN ('APPROVED', 'PAID')
      GROUP BY DATE(e.expense_date)
      ORDER BY DATE(e.expense_date) DESC
    ` as Array<{
      date: Date
      total_expenses: number
      stock_expenses: number
      payroll_expenses: number
      operational_expenses: number
      other_expenses: number
    }>

    // Calculate cost of goods sold from item sales
    const cogsData = await prisma.$queryRaw`
      SELECT 
        DATE(s.sale_date) as date,
        SUM(
          CASE 
            WHEN o.id IS NOT NULL THEN 
              (SELECT SUM(oi.quantity * i.cost_price)
               FROM order_items oi 
               JOIN items i ON oi.item_id = i.id 
               WHERE oi.order_id = o.id)
            ELSE 0 
          END
        )::FLOAT as total_cogs
      FROM sales s
      LEFT JOIN orders o ON s.order_id = o.id
      WHERE s.sale_date >= ${startDate}
        AND s.sale_date < ${endDate}
        AND s.status = 'COMPLETED'
      GROUP BY DATE(s.sale_date)
      ORDER BY DATE(s.sale_date) DESC
    ` as Array<{
      date: Date
      total_cogs: number
    }>

    // Merge all data by date
    const combinedData = salesData.map(sale => {
      const expenses = expenseData.find(exp => 
        new Date(exp.date).toDateString() === new Date(sale.date).toDateString()
      )
      const cogs = cogsData.find(c => 
        new Date(c.date).toDateString() === new Date(sale.date).toDateString()
      )

      const directCosts = (cogs?.total_cogs || 0) + (expenses?.stock_expenses || 0)
      const totalExpenses = (expenses?.total_expenses || 0) + directCosts
      const grossProfit = sale.total_revenue - directCosts
      const netProfit = sale.total_revenue - totalExpenses

      return {
        date: sale.date.toISOString().split('T')[0],
        totalSales: sale.total_sales,
        totalRevenue: sale.total_revenue,
        directCosts,
        totalExpenses,
        grossProfit,
        netProfit,
        grossMargin: sale.total_revenue > 0 ? (grossProfit / sale.total_revenue) * 100 : 0,
        netMargin: sale.total_revenue > 0 ? (netProfit / sale.total_revenue) * 100 : 0,
        paymentBreakdown: {
          cash: sale.cash_sales,
          card: sale.card_sales,
          digitalWallet: sale.digital_wallet_sales,
          bankTransfer: sale.bank_transfer_sales
        },
        expenseBreakdown: {
          costOfGoods: cogs?.total_cogs || 0,
          stockExpenses: expenses?.stock_expenses || 0,
          payrollExpenses: expenses?.payroll_expenses || 0,
          operationalExpenses: expenses?.operational_expenses || 0,
          otherExpenses: expenses?.other_expenses || 0
        },
        totalDiscounts: sale.total_discounts
      }
    })

    // Calculate summary for the period
    const totalRevenue = combinedData.reduce((sum, day) => sum + day.totalRevenue, 0)
    const totalDirectCosts = combinedData.reduce((sum, day) => sum + day.directCosts, 0)
    const totalExpenses = combinedData.reduce((sum, day) => sum + day.totalExpenses, 0)
    const totalGrossProfit = totalRevenue - totalDirectCosts
    const totalNetProfit = totalRevenue - totalExpenses

    return {
      success: true,
      period,
      summary: {
        totalRevenue,
        totalDirectCosts,
        totalExpenses,
        totalGrossProfit,
        totalNetProfit,
        grossMargin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
        netMargin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0,
        totalSales: combinedData.reduce((sum, day) => sum + day.totalSales, 0),
        daysWithData: combinedData.length
      },
      dailyData: combinedData
    }
  } catch (error) {
    console.error('Error in comprehensive profit analysis:', error)
    return {
      success: false,
      error: 'Failed to analyze comprehensive profits'
    }
  }
}

// Balance Sheet Generator
export async function generateBalanceSheet(asOfDate: Date = new Date()) {
  try {
    // Assets - Current Assets
    const inventoryValue = await prisma.$queryRaw`
      SELECT SUM(current_stock * cost_price)::FLOAT as total_value
      FROM items
      WHERE is_active = true
    ` as Array<{ total_value: number }>

    const cashFromSales = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN payment_method = 'CASH' THEN final_amount ELSE 0 END)::FLOAT as cash_balance
      FROM sales
      WHERE sale_date <= ${asOfDate}
        AND status = 'COMPLETED'
    ` as Array<{ cash_balance: number }>

    // Liabilities - Accounts Payable (Unpaid expenses)
    const accountsPayable = await prisma.$queryRaw`
      SELECT SUM(amount)::FLOAT as total_payable
      FROM expenses
      WHERE expense_date <= ${asOfDate}
        AND status IN ('PENDING', 'APPROVED')
    ` as Array<{ total_payable: number }>

    // Payroll Liabilities (Unpaid salaries)
    const payrollLiabilities = await prisma.$queryRaw`
      SELECT SUM(total_amount)::FLOAT as total_payroll_due
      FROM payrolls
      WHERE period <= ${asOfDate}
        AND status IN ('PENDING', 'APPROVED')
    ` as Array<{ total_payroll_due: number }>

    // Revenue and Expenses for Equity calculation
    const totalRevenue = await prisma.$queryRaw`
      SELECT SUM(final_amount)::FLOAT as total_revenue
      FROM sales
      WHERE sale_date <= ${asOfDate}
        AND status = 'COMPLETED'
    ` as Array<{ total_revenue: number }>

    const totalExpenses = await prisma.$queryRaw`
      SELECT SUM(amount)::FLOAT as total_expenses
      FROM expenses
      WHERE expense_date <= ${asOfDate}
        AND status IN ('APPROVED', 'PAID')
    ` as Array<{ total_expenses: number }>

    const assets = {
      currentAssets: {
        inventory: inventoryValue[0]?.total_value || 0,
        cash: cashFromSales[0]?.cash_balance || 0,
        total: (inventoryValue[0]?.total_value || 0) + (cashFromSales[0]?.cash_balance || 0)
      },
      totalAssets: (inventoryValue[0]?.total_value || 0) + (cashFromSales[0]?.cash_balance || 0)
    }

    const liabilities = {
      currentLiabilities: {
        accountsPayable: accountsPayable[0]?.total_payable || 0,
        payrollPayable: payrollLiabilities[0]?.total_payroll_due || 0,
        total: (accountsPayable[0]?.total_payable || 0) + (payrollLiabilities[0]?.total_payroll_due || 0)
      },
      totalLiabilities: (accountsPayable[0]?.total_payable || 0) + (payrollLiabilities[0]?.total_payroll_due || 0)
    }

    const retainedEarnings = (totalRevenue[0]?.total_revenue || 0) - (totalExpenses[0]?.total_expenses || 0)
    const equity = {
      retainedEarnings,
      totalEquity: retainedEarnings
    }

    // Partnership distribution (40/60 split)
    const partnershipDistribution = {
      partner1Share: retainedEarnings * 0.4, // 40%
      partner2Share: retainedEarnings * 0.6, // 60%
      totalDistributable: retainedEarnings
    }

    return {
      success: true,
      balanceSheet: {
        asOfDate: asOfDate.toISOString().split('T')[0],
        assets,
        liabilities,
        equity,
        partnershipDistribution,
        balanceCheck: assets.totalAssets - liabilities.totalLiabilities - equity.totalEquity
      }
    }
  } catch (error) {
    console.error('Error generating balance sheet:', error)
    return {
      success: false,
      error: 'Failed to generate balance sheet'
    }
  }
}
