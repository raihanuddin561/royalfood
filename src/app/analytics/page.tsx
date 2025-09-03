'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, ShoppingCart, Receipt, BarChart3, PieChart, Filter, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PeriodAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate: string
  revenue: {
    total: number
    average: number
    trend: number
  }
  expenses: {
    total: number
    byType: Record<string, number>
    trend: number
  }
  profit: {
    gross: number
    net: number
    margin: number
  }
  inventory: {
    cogs: number
    stockUsage: number
    waste: number
    turnover: number
  }
}

export default function CostAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [analytics, setAnalytics] = useState<PeriodAnalytics | null>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod, startDate, endDate])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Load comprehensive profit analysis
      const profitParams = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      })
      
      const profitRes = await fetch(`/api/profit-analysis?${profitParams}`)
      if (profitRes.ok) {
        const profitData = await profitRes.json()
        setDailyData(profitData.dailyData || [])
        
        // Transform data for analytics view
        const transformed: PeriodAnalytics = {
          period: selectedPeriod,
          startDate,
          endDate,
          revenue: {
            total: profitData.summary?.totalRevenue || 0,
            average: profitData.dailyData?.length > 0 ? (profitData.summary?.totalRevenue || 0) / profitData.dailyData.length : 0,
            trend: calculateTrend(profitData.dailyData, 'totalRevenue')
          },
          expenses: {
            total: profitData.summary?.effectiveTotalExpenses || 0,
            byType: {
              payroll: profitData.summary?.breakdown?.totalPayrollExpenses || 0,
              utilities: profitData.summary?.breakdown?.totalUtilitiesExpenses || 0,
              operational: profitData.summary?.breakdown?.totalOperationalExpenses || 0,
              stock: profitData.summary?.breakdown?.totalStockUsageCost || 0,
              cogs: profitData.summary?.breakdown?.totalCOGS || 0
            },
            trend: calculateTrend(profitData.dailyData, 'effectiveTotalExpenses')
          },
          profit: {
            gross: profitData.summary?.grossProfit || 0,
            net: profitData.summary?.netProfit || 0,
            margin: profitData.summary?.netProfitMargin || 0
          },
          inventory: {
            cogs: profitData.summary?.breakdown?.totalCOGS || 0,
            stockUsage: profitData.summary?.breakdown?.totalStockUsageCost || 0,
            waste: profitData.summary?.breakdown?.totalWasteCost || 0,
            turnover: calculateInventoryTurnover(profitData.summary)
          }
        }
        
        setAnalytics(transformed)
      }

      // Load expense analytics for additional insights
      const expenseParams = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      })
      
      const expenseRes = await fetch(`/api/expenses/analytics?${expenseParams}`)
      if (expenseRes.ok) {
        const expenseData = await expenseRes.json()
        // Could merge additional expense analytics here
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (dailyData: any[], field: string) => {
    if (!dailyData || dailyData.length < 2) return 0
    const recent = dailyData.slice(-7).reduce((sum, day) => sum + (day[field] || 0), 0) / 7
    const previous = dailyData.slice(-14, -7).reduce((sum, day) => sum + (day[field] || 0), 0) / 7
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0
  }

  const calculateInventoryTurnover = (summary: any) => {
    if (!summary?.breakdown) return 0
    const avgInventory = 50000 // This should come from inventory API
    const cogs = summary.breakdown.totalCOGS || 0
    return avgInventory > 0 ? cogs / avgInventory : 0
  }

  const getDateRangeForPeriod = (period: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (period) {
      case 'daily':
        start.setDate(end.getDate() - 30)
        break
      case 'weekly':
        start.setDate(end.getDate() - 7 * 12) // 12 weeks
        break
      case 'monthly':
        start.setMonth(end.getMonth() - 12) // 12 months
        break
      case 'yearly':
        start.setFullYear(end.getFullYear() - 3) // 3 years
        break
    }
    
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setSelectedPeriod(period)
    const range = getDateRangeForPeriod(period)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive cost tracking and analysis across all time periods</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.revenue.total)}</p>
                <p className={`text-xs mt-1 flex items-center ${analytics.revenue.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenue.trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(analytics.revenue.trend).toFixed(1)}% trend
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.expenses.total)}</p>
                <p className={`text-xs mt-1 flex items-center ${analytics.expenses.trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.expenses.trend <= 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                  {Math.abs(analytics.expenses.trend).toFixed(1)}% trend
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${analytics.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.profit.net)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{analytics.profit.margin.toFixed(1)}% margin</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.inventory.turnover.toFixed(2)}x</p>
                <p className="text-xs text-gray-500 mt-1">Times per period</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(analytics.expenses.byType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        type === 'payroll' ? 'bg-blue-500' :
                        type === 'utilities' ? 'bg-yellow-500' :
                        type === 'operational' ? 'bg-purple-500' :
                        type === 'stock' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {type === 'cogs' ? 'Cost of Goods Sold' : type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.expenses.total > 0 ? ((amount / analytics.expenses.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Costs</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Cost of Goods Sold</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(analytics.inventory.cogs)}</p>
                    <p className="text-xs text-gray-500">Direct sales cost</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Stock Usage</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(analytics.inventory.stockUsage)}</p>
                    <p className="text-xs text-gray-500">Production cost</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Waste & Spoilage</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(analytics.inventory.waste)}</p>
                    <p className="text-xs text-gray-500">Lost inventory</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total Inventory Cost</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(analytics.inventory.cogs + analytics.inventory.stockUsage + analytics.inventory.waste)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Trend Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Trends
          </h3>
          <p className="text-sm text-gray-500">Revenue vs Expenses over time</p>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400 mt-1">
                {dailyData.length} data points from {formatDate(startDate)} to {formatDate(endDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
