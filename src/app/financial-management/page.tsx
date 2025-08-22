'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, ShoppingCart, Receipt, BarChart3, PieChart, Plus, FileText, Calculator } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getComprehensiveFinancialData, recordStockInput, recordEmployeeExpense, type ComprehensiveFinancialData } from '@/app/actions/financial-analysis'

// Safe currency formatting function
const safeCurrencyFormat = (amount: number | null | undefined): string => {
  try {
    return formatCurrency(amount || 0)
  } catch (error) {
    console.warn('Currency formatting error:', error)
    return `৳${(amount || 0).toFixed(2)}`
  }
}

export default function FinancialManagementPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [financialData, setFinancialData] = useState<ComprehensiveFinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    loadFinancialData()
  }, [selectedDate, selectedPeriod])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      const result = await getComprehensiveFinancialData({
        date: new Date(selectedDate),
        period: selectedPeriod
      })
      
      if (result.success) {
        setFinancialData(result.data)
      } else {
        console.warn('Financial data loading warning:', result.error)
        // Set default data if failed but don't crash the app
        if (result.data) {
          setFinancialData(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
      // Set safe default data to prevent crash
      setFinancialData({
        date: selectedDate,
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
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (actionType: string) => {
    // Navigate to respective pages or open modals
    switch (actionType) {
      case 'stock-input':
        window.location.href = '/inventory/add'
        break
      case 'stock-expense':
        window.location.href = '/expenses?type=STOCK'
        break
      case 'employee-expense':
        window.location.href = '/expenses?type=PAYROLL'
        break
      case 'daily-sale':
        window.location.href = '/sales/daily'
        break
      default:
        break
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
          <h1 className="text-3xl font-bold text-gray-900">Complete Financial Management</h1>
          <p className="mt-2 text-gray-600">
            Stock Input • Stock Expenses • Employee Expenses • Daily Sales → Automatic Profit/Loss & Balance Sheet
          </p>
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
              onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showQuickActions ? 'Hide Actions' : 'Show All Actions'}
          </button>
        </div>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${showQuickActions ? '' : 'md:grid-cols-4'}`}>
          <button
            onClick={() => handleQuickAction('stock-input')}
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-800">Add Stock Input</span>
            <span className="text-xs text-blue-600 mt-1">Receive Inventory</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('stock-expense')}
            className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
          >
            <Receipt className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-800">Stock Expenses</span>
            <span className="text-xs text-orange-600 mt-1">Purchase Costs</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('employee-expense')}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <Users className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-800">Employee Expenses</span>
            <span className="text-xs text-purple-600 mt-1">Payroll & Wages</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('daily-sale')}
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <ShoppingCart className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-800">Daily Sales</span>
            <span className="text-xs text-green-600 mt-1">Record Revenue</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {financialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">{safeCurrencyFormat(financialData.dailySales)}</p>
                <p className="text-xs text-gray-500 mt-1">{financialData.totalOrders || 0} orders</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Avg: {safeCurrencyFormat(financialData.averageOrderValue)} per order
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{safeCurrencyFormat(financialData.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">All categories</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-orange-600">Stock: {safeCurrencyFormat(financialData.stockExpenses)}</span>
                <span className="text-purple-600">Employee: {safeCurrencyFormat(financialData.employeeExpenses)}</span>
              </div>
              <div className="text-xs text-blue-600">
                Operational: {safeCurrencyFormat(financialData.operationalExpenses)}
              </div>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${(financialData.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeCurrencyFormat(financialData.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{(financialData.profitMargin || 0).toFixed(1)}% margin</p>
              </div>
              <div className={`w-12 h-12 ${(financialData.netProfit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${(financialData.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Gross: {safeCurrencyFormat(financialData.grossProfit)}
            </div>
          </div>

          {/* Stock Value Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-blue-600">{safeCurrencyFormat(financialData.currentStockValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Current inventory</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Turnover: {(financialData.stockTurnover || 0).toFixed(1)}x
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis Grid */}
      {financialData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profit & Loss Statement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Profit & Loss Statement
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Revenue</span>
                <span className="font-semibold text-green-600">{safeCurrencyFormat(financialData.dailySales)}</span>
              </div>
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Orders: {financialData.totalOrders}</span>
                  <span className="text-gray-500">Avg: {safeCurrencyFormat(financialData.averageOrderValue)}</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-red-600">
                  <span className="font-medium">Cost of Goods Sold</span>
                  <span className="font-semibold">-{safeCurrencyFormat(financialData.stockExpenses)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-medium text-gray-700">Gross Profit</span>
                <span className="font-semibold text-blue-600">{safeCurrencyFormat(financialData.grossProfit)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Employee Expenses</span>
                  <span className="text-red-500">-{safeCurrencyFormat(financialData.employeeExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Operational Expenses</span>
                  <span className="text-red-500">-{safeCurrencyFormat(financialData.operationalExpenses)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t pt-3 text-lg">
                <span className="font-bold text-gray-900">Net Profit</span>
                <span className={`font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeCurrencyFormat(financialData.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Balance Sheet
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Assets</h4>
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inventory</span>
                    <span>{safeCurrencyFormat(financialData.currentStockValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash (Estimated)</span>
                    <span>{safeCurrencyFormat(Math.max(0, financialData.netCashFlow))}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Assets</span>
                    <span>{safeCurrencyFormat(financialData.totalAssets)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Liabilities</h4>
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accounts Payable</span>
                    <span>{safeCurrencyFormat(financialData.totalLiabilities)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Liabilities</span>
                    <span>{safeCurrencyFormat(financialData.totalLiabilities)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Equity</span>
                  <span className="text-green-600">{safeCurrencyFormat(financialData.equity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                Cash Flow Analysis
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Cash Inflows</h4>
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales Revenue</span>
                    <span className="text-green-600">{safeCurrencyFormat(financialData.cashInflow)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Cash Outflows</h4>
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock Purchases</span>
                    <span className="text-red-500">{safeCurrencyFormat(financialData.stockExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employee Costs</span>
                    <span className="text-red-500">{safeCurrencyFormat(financialData.employeeExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operations</span>
                    <span className="text-red-500">{safeCurrencyFormat(financialData.operationalExpenses)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Outflows</span>
                    <span className="text-red-500">{safeCurrencyFormat(financialData.cashOutflow)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Cash Flow</span>
                  <span className={financialData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {safeCurrencyFormat(financialData.netCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Complete Financial Management System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Daily Operations:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>✓ Add stock input → Updates inventory & creates stock expenses</li>
              <li>✓ Record employee expenses → Tracks payroll costs</li>
              <li>✓ Log daily sales → Calculates revenue & profit</li>
              <li>✓ All calculations happen automatically</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Financial Reports:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>✓ Real-time Profit & Loss Statement</li>
              <li>✓ Automated Balance Sheet generation</li>
              <li>✓ Cash Flow Analysis</li>
              <li>✓ Stock turnover & profitability metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
