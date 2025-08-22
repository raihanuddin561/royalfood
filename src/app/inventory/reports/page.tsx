import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, FileText, Download, Calendar, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Get comprehensive financial data for balance sheet
async function getFinancialData() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  
  try {
    const [items, inventoryLogs, sales, monthlyLogs, yearlyLogs] = await Promise.all([
      // Get all inventory items with current values
      prisma.item.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          },
          supplier: {
            select: {
              name: true
            }
          }
        },
        where: {
          isActive: true
        }
      }),
      
      // Get all inventory movements
      prisma.inventoryLog.findMany({
        include: {
          item: {
            select: {
              name: true,
              costPrice: true,
              unit: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Get sales data for revenue calculations
      prisma.sale.findMany({
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  menuItem: true
                }
              }
            }
          }
        }
      }),
      
      // Monthly inventory logs
      prisma.inventoryLog.findMany({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        },
        include: {
          item: {
            select: {
              name: true,
              costPrice: true,
              unit: true
            }
          }
        }
      }),
      
      // Yearly inventory logs
      prisma.inventoryLog.findMany({
        where: {
          createdAt: {
            gte: startOfYear
          }
        },
        include: {
          item: {
            select: {
              name: true,
              costPrice: true,
              unit: true
            }
          }
        }
      })
    ])

    // Calculate current inventory value (Assets)
    const currentInventoryValue = items.reduce((sum, item) => {
      return sum + (item.currentStock * item.costPrice)
    }, 0)

    // Calculate inventory movements
    const stockInValue = inventoryLogs
      .filter(log => log.type === 'STOCK_IN')
      .reduce((sum, log) => sum + (log.quantity * log.item.costPrice), 0)
    
    const stockOutValue = inventoryLogs
      .filter(log => log.type === 'STOCK_OUT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)
    
    const wasteValue = inventoryLogs
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)
    
    const adjustmentValue = inventoryLogs
      .filter(log => log.type === 'ADJUSTMENT')
      .reduce((sum, log) => {
        return sum + (log.quantity > 0 ? log.quantity * log.item.costPrice : Math.abs(log.quantity) * log.item.costPrice)
      }, 0)

    // Monthly analysis
    const monthlyStockIn = monthlyLogs
      .filter(log => log.type === 'STOCK_IN')
      .reduce((sum, log) => sum + (log.quantity * log.item.costPrice), 0)
    
    const monthlyStockOut = monthlyLogs
      .filter(log => log.type === 'STOCK_OUT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)
    
    const monthlyWaste = monthlyLogs
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)

    // Yearly analysis
    const yearlyStockIn = yearlyLogs
      .filter(log => log.type === 'STOCK_IN')
      .reduce((sum, log) => sum + (log.quantity * log.item.costPrice), 0)
    
    const yearlyStockOut = yearlyLogs
      .filter(log => log.type === 'STOCK_OUT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)
    
    const yearlyWaste = yearlyLogs
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)

    // Calculate Cost of Goods Sold (COGS)
    const totalCOGS = stockOutValue + wasteValue

    // Calculate Gross Profit (Sales Revenue - COGS)
    const totalSalesRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0)
    const grossProfit = totalSalesRevenue - totalCOGS

    // Category-wise analysis
    const categoryAnalysis = items.reduce((acc, item) => {
      const categoryName = item.category?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = {
          items: 0,
          totalValue: 0,
          totalStock: 0
        }
      }
      acc[categoryName].items += 1
      acc[categoryName].totalValue += item.currentStock * item.costPrice
      acc[categoryName].totalStock += item.currentStock
      return acc
    }, {} as Record<string, { items: number; totalValue: number; totalStock: number }>)

    // Inventory turnover calculation
    const averageInventoryValue = (currentInventoryValue + stockInValue) / 2
    const inventoryTurnover = averageInventoryValue > 0 ? totalCOGS / averageInventoryValue : 0

    return {
      balanceSheet: {
        assets: {
          currentInventoryValue,
          totalAssets: currentInventoryValue // For now, only inventory assets
        },
        liabilities: {
          accountsPayable: stockInValue, // Simplified - money owed to suppliers
          totalLiabilities: stockInValue
        },
        equity: {
          retainedEarnings: grossProfit,
          totalEquity: grossProfit
        }
      },
      incomeStatement: {
        revenue: totalSalesRevenue,
        cogs: totalCOGS,
        grossProfit,
        grossProfitMargin: totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0
      },
      inventoryMetrics: {
        totalValue: currentInventoryValue,
        stockInValue,
        stockOutValue,
        wasteValue,
        adjustmentValue,
        inventoryTurnover,
        wastePercentage: stockInValue > 0 ? (wasteValue / stockInValue) * 100 : 0
      },
      monthlyAnalysis: {
        stockIn: monthlyStockIn,
        stockOut: monthlyStockOut,
        waste: monthlyWaste,
        netChange: monthlyStockIn - monthlyStockOut - monthlyWaste
      },
      yearlyAnalysis: {
        stockIn: yearlyStockIn,
        stockOut: yearlyStockOut,
        waste: yearlyWaste,
        netChange: yearlyStockIn - yearlyStockOut - yearlyWaste
      },
      categoryAnalysis,
      items,
      inventoryLogs: inventoryLogs.slice(0, 20) // Recent 20 logs
    }
  } catch (error) {
    console.error('Financial data fetch error:', error)
    return null
  }
}

export default async function InventoryReportsPage() {
  const data = await getFinancialData()
  
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Financial Data</h2>
          <p className="text-gray-600 mb-4">Unable to load financial reports at this time.</p>
          <Link
            href="/inventory"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Link>
        </div>
      </div>
    )
  }

  const {
    balanceSheet,
    incomeStatement,
    inventoryMetrics,
    monthlyAnalysis,
    yearlyAnalysis,
    categoryAnalysis,
    inventoryLogs
  } = data

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/inventory"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Inventory
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Financial Reports & Balance Sheet</h1>
              <p className="mt-2 text-gray-600">Comprehensive financial analysis of inventory operations</p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(balanceSheet.assets.totalAssets)}</p>
                <p className="text-xs text-green-500 mt-1">Current Inventory Value</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(incomeStatement.grossProfit)}</p>
                <p className="text-xs text-blue-500 mt-1">{incomeStatement.grossProfitMargin.toFixed(1)}% margin</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryMetrics.inventoryTurnover.toFixed(2)}x</p>
                <p className="text-xs text-gray-500 mt-1">Times per period</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Waste Percentage</p>
                <p className="text-2xl font-bold text-red-600">{inventoryMetrics.wastePercentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(inventoryMetrics.wasteValue)} wasted</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Balance Sheet</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assets */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assets</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Inventory</span>
                    <span className="font-medium">{formatCurrency(balanceSheet.assets.currentInventoryValue)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Assets</span>
                      <span>{formatCurrency(balanceSheet.assets.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liabilities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Liabilities</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accounts Payable</span>
                    <span className="font-medium">{formatCurrency(balanceSheet.liabilities.accountsPayable)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Liabilities</span>
                      <span>{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Equity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retained Earnings</span>
                    <span className={`font-medium ${balanceSheet.equity.retainedEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balanceSheet.equity.retainedEarnings)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Equity</span>
                      <span className={balanceSheet.equity.totalEquity >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(balanceSheet.equity.totalEquity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Income Statement Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Income Statement (Inventory Impact)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(incomeStatement.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
                <span className="font-medium text-red-600">({formatCurrency(incomeStatement.cogs)})</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Gross Profit</span>
                  <span className={incomeStatement.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(incomeStatement.grossProfit)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Gross Profit Margin: {incomeStatement.grossProfitMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Analysis</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Additions</span>
                  <span className="font-medium text-green-600">{formatCurrency(monthlyAnalysis.stockIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Usage</span>
                  <span className="font-medium text-blue-600">{formatCurrency(monthlyAnalysis.stockOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waste</span>
                  <span className="font-medium text-red-600">{formatCurrency(monthlyAnalysis.waste)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Change</span>
                    <span className={monthlyAnalysis.netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyAnalysis.netChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Yearly Analysis</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Additions</span>
                  <span className="font-medium text-green-600">{formatCurrency(yearlyAnalysis.stockIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Usage</span>
                  <span className="font-medium text-blue-600">{formatCurrency(yearlyAnalysis.stockOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waste</span>
                  <span className="font-medium text-red-600">{formatCurrency(yearlyAnalysis.waste)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Change</span>
                    <span className={yearlyAnalysis.netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(yearlyAnalysis.netChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryAnalysis).map(([category, data]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{data.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium text-green-600">{formatCurrency(data.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Value:</span>
                      <span className="font-medium">{formatCurrency(data.items > 0 ? data.totalValue / data.items : 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Inventory Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Inventory Movements</h2>
          </div>
          <div className="p-6">
            {inventoryLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No inventory movements recorded</p>
            ) : (
              <div className="space-y-3">
                {inventoryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.type === 'STOCK_IN' 
                          ? 'bg-green-100' 
                          : log.type === 'STOCK_OUT' 
                            ? 'bg-red-100' 
                            : log.type === 'WASTE'
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                      }`}>
                        {log.type === 'STOCK_IN' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : log.type === 'STOCK_OUT' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : log.type === 'WASTE' ? (
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Package className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.item.name}: {Math.abs(log.quantity)} {log.item.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.type === 'STOCK_IN' && 'Added to stock'}
                          {log.type === 'STOCK_OUT' && 'Used from stock'}
                          {log.type === 'WASTE' && 'Recorded as waste'}
                          {log.type === 'ADJUSTMENT' && 'Stock adjusted'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(Math.abs(log.quantity) * log.item.costPrice)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
