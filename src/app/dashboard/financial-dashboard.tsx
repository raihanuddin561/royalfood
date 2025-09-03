'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, ShoppingCart, Receipt, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DailyFinancialData {
  date: string
  // Revenue
  dailySales: number
  totalOrders: number
  averageOrderValue: number
  
  // Expenses
  stockExpenses: number
  employeeExpenses: number
  operationalExpenses: number
  totalExpenses: number
  
  // Inventory
  stockValue: number
  stockMovement: number
  
  // Calculations
  grossProfit: number
  netProfit: number
  profitMargin: number
}

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  grossMargin: number
  stockTurnover: number
  employeeCosts: number
  operationalCosts: number
}

export default function FinancialDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [financialData, setFinancialData] = useState<DailyFinancialData | null>(null)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFinancialData()
  }, [selectedDate, selectedPeriod])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      // Load real financial data based on selected period
      const today = new Date(selectedDate)
      const startDate = new Date(today)
      
      // Calculate date range based on selected period
      switch (selectedPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(today.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(today.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1)
          break
      }

      // Load daily costs for selected date
      const dailyCostsRes = await fetch(`/api/restaurant-operations/daily-costs?date=${selectedDate}`)
      let dailyData: DailyFinancialData = {
        date: selectedDate,
        dailySales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        stockExpenses: 0,
        employeeExpenses: 0,
        operationalExpenses: 0,
        totalExpenses: 0,
        stockValue: 0,
        stockMovement: 0,
        grossProfit: 0,
        netProfit: 0,
        profitMargin: 0
      }

      if (dailyCostsRes.ok) {
        const costs = await dailyCostsRes.json()
        if (costs.success) {
          dailyData = {
            date: selectedDate,
            dailySales: costs.dailySummary?.revenue || 0,
            totalOrders: costs.dailySummary?.transactions?.sales || 0,
            averageOrderValue: costs.dailySummary?.transactions?.sales > 0 
              ? (costs.dailySummary?.revenue || 0) / costs.dailySummary.transactions.sales 
              : 0,
            stockExpenses: costs.dailySummary?.costs?.stock || 0,
            employeeExpenses: costs.dailySummary?.costs?.employee || 0,
            operationalExpenses: costs.dailySummary?.costs?.operational || 0,
            totalExpenses: costs.dailySummary?.costs?.total || 0,
            stockValue: 0, // Would need inventory API
            stockMovement: 0, // Would calculate from stock usage
            grossProfit: costs.dailySummary?.profit?.gross || 0,
            netProfit: (costs.dailySummary?.revenue || 0) - (costs.dailySummary?.costs?.total || 0),
            profitMargin: costs.dailySummary?.profit?.margin || 0
          }
        }
      }

      // Load period summary for comparison
      const profitParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: today.toISOString()
      })
      
      const profitRes = await fetch(`/api/profit-analysis?${profitParams}`)
      let summaryData: FinancialSummary = {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        grossMargin: 0,
        stockTurnover: 0,
        employeeCosts: 0,
        operationalCosts: 0
      }

      if (profitRes.ok) {
        const profit = await profitRes.json()
        summaryData = {
          totalRevenue: profit.summary?.totalRevenue || 0,
          totalExpenses: profit.summary?.effectiveTotalExpenses || 0,
          netProfit: profit.summary?.netProfit || 0,
          grossMargin: profit.summary?.grossProfitMargin || 0,
          stockTurnover: 0, // Would calculate from inventory turnover
          employeeCosts: profit.summary?.breakdown?.totalPayrollExpenses || 0,
          operationalCosts: (profit.summary?.breakdown?.totalUtilitiesExpenses || 0) + 
                           (profit.summary?.breakdown?.totalOperationalExpenses || 0)
        }
      }

      setFinancialData(dailyData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading financial data:', error)
      // Set empty data instead of mock data
      setFinancialData({
        date: selectedDate,
        dailySales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        stockExpenses: 0,
        employeeExpenses: 0,
        operationalExpenses: 0,
        totalExpenses: 0,
        stockValue: 0,
        stockMovement: 0,
        grossProfit: 0,
        netProfit: 0,
        profitMargin: 0
      })
      setSummary({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        grossMargin: 0,
        stockTurnover: 0,
        employeeCosts: 0,
        operationalCosts: 0
      })
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="mt-2 text-gray-600">Complete view of stocks, expenses, sales, and profitability</p>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {financialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Daily Sales */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Sales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(financialData.dailySales)}</p>
                <p className="text-xs text-gray-500 mt-1">{financialData.totalOrders} orders</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(financialData.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">All costs included</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialData.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{financialData.profitMargin}% margin</p>
              </div>
              <div className={`w-12 h-12 ${financialData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          {/* Stock Value */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialData.stockValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Current inventory</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {financialData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Revenue Analysis
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Sales</span>
                  <span className="font-semibold text-green-600">{formatCurrency(financialData.dailySales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold">{financialData.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold">{formatCurrency(financialData.averageOrderValue)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Gross Profit</span>
                    <span className="font-bold text-green-600">{formatCurrency(financialData.grossProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-red-600" />
                Expense Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded mr-3"></div>
                    <span className="text-gray-600">Stock Expenses</span>
                  </div>
                  <span className="font-semibold text-orange-600">{formatCurrency(financialData.stockExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-3"></div>
                    <span className="text-gray-600">Employee Expenses</span>
                  </div>
                  <span className="font-semibold text-blue-600">{formatCurrency(financialData.employeeExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded mr-3"></div>
                    <span className="text-gray-600">Operational Expenses</span>
                  </div>
                  <span className="font-semibold text-purple-600">{formatCurrency(financialData.operationalExpenses)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Expenses</span>
                    <span className="font-bold text-red-600">{formatCurrency(financialData.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Package className="w-5 h-5 mr-2" />
          Add Stock Input
        </button>
        <button className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          <Receipt className="w-5 h-5 mr-2" />
          Record Stock Expense
        </button>
        <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Users className="w-5 h-5 mr-2" />
          Add Employee Expense
        </button>
        <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Record Daily Sale
        </button>
      </div>

      {/* Period Summary */}
      {summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Period Summary ({selectedPeriod})</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-lg font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netProfit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Gross Margin</p>
                <p className="text-lg font-bold text-blue-600">{summary.grossMargin}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Employee Costs</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.employeeCosts)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Stock Turnover</p>
                <p className="text-lg font-bold text-orange-600">{summary.stockTurnover}x</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
