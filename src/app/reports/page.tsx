'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, Building, Receipt } from 'lucide-react'
import { generateBalanceSheet, getComprehensiveProfitAnalysis } from '@/app/actions/sales'
import { getExpenseAnalytics } from '@/app/actions/expenses'

interface BalanceSheetData {
  asOfDate: string
  assets: {
    currentAssets: {
      inventory: number
      cash: number
      total: number
    }
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: {
      accountsPayable: number
      payrollPayable: number
      total: number
    }
    totalLiabilities: number
  }
  equity: {
    retainedEarnings: number
    totalEquity: number
  }
  partnershipDistribution: {
    partner1Share: number
    partner2Share: number
    totalDistributable: number
  }
  balanceCheck: number
}

export default function FinancialReportsPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null)
  const [expenseAnalytics, setExpenseAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  useEffect(() => {
    loadFinancialData()
  }, [selectedDate, selectedPeriod])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      // Load balance sheet
      const balanceSheetResult = await generateBalanceSheet(new Date(selectedDate))
      if (balanceSheetResult.success) {
        setBalanceSheet(balanceSheetResult.balanceSheet)
      }

      // Load comprehensive profit analysis
      const profitResult = await getComprehensiveProfitAnalysis(selectedPeriod)
      if (profitResult.success) {
        setProfitAnalysis(profitResult)
      }

      // Load expense analytics
      const startDate = selectedPeriod === 'today' 
        ? new Date() 
        : selectedPeriod === 'this_month'
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        : new Date(new Date().setDate(new Date().getDate() - 30))

      const expenseResult = await getExpenseAnalytics({
        startDate,
        endDate: new Date()
      })
      if (expenseResult.success) {
        setExpenseAnalytics(expenseResult.analytics)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports & Balance Sheet</h1>
          <p className="mt-2 text-gray-600">Comprehensive financial overview and partnership distribution</p>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      {profitAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(profitAnalysis.summary.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">{profitAnalysis.period}</p>
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
                <p className="text-2xl font-bold text-red-600">{formatCurrency(profitAnalysis.summary.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">All costs included</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${profitAnalysis.summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitAnalysis.summary.totalNetProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{profitAnalysis.summary.netMargin.toFixed(1)}% margin</p>
              </div>
              <div className={`w-12 h-12 ${profitAnalysis.summary.totalNetProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${profitAnalysis.summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className={`text-2xl font-bold ${profitAnalysis.summary.totalGrossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(profitAnalysis.summary.totalGrossProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{profitAnalysis.summary.grossMargin.toFixed(1)}% margin</p>
              </div>
              <div className={`w-12 h-12 ${profitAnalysis.summary.totalGrossProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${profitAnalysis.summary.totalGrossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {balanceSheet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets & Liabilities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Balance Sheet</h3>
              <p className="text-sm text-gray-500">As of {formatDate(balanceSheet.asOfDate)}</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Assets */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-green-600" />
                  Assets
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Assets:</span>
                  </div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Inventory</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.assets.currentAssets.inventory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.assets.currentAssets.cash)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Current Assets</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.assets.currentAssets.total)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>TOTAL ASSETS</span>
                    <span>{formatCurrency(balanceSheet.assets.totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-red-600" />
                  Liabilities
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Liabilities:</span>
                  </div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Accounts Payable</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.liabilities.currentLiabilities.accountsPayable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payroll Payable</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.liabilities.currentLiabilities.payrollPayable)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Current Liabilities</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.liabilities.currentLiabilities.total)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>TOTAL LIABILITIES</span>
                    <span>{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Equity
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retained Earnings</span>
                    <span className="font-medium">{formatCurrency(balanceSheet.equity.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>TOTAL EQUITY</span>
                    <span>{formatCurrency(balanceSheet.equity.totalEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partnership Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Partnership Distribution</h3>
              <p className="text-sm text-gray-500">40/60 Profit Sharing</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Distributable Amount</h4>
                  <p className={`text-3xl font-bold ${balanceSheet.partnershipDistribution.totalDistributable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balanceSheet.partnershipDistribution.totalDistributable)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        Partner 1 (40%)
                      </h5>
                    </div>
                    <p className={`text-2xl font-bold ${balanceSheet.partnershipDistribution.partner1Share >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balanceSheet.partnershipDistribution.partner1Share)}
                    </p>
                    <p className="text-sm text-gray-500">40% of total profits</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        Partner 2 (60%)
                      </h5>
                    </div>
                    <p className={`text-2xl font-bold ${balanceSheet.partnershipDistribution.partner2Share >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balanceSheet.partnershipDistribution.partner2Share)}
                    </p>
                    <p className="text-sm text-gray-500">60% of total profits</p>
                  </div>
                </div>

                {/* Balance Check */}
                <div className={`p-4 rounded-lg ${Math.abs(balanceSheet.balanceCheck) < 0.01 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h5 className="font-semibold text-gray-900 mb-1">Balance Check</h5>
                  <p className={`text-sm ${Math.abs(balanceSheet.balanceCheck) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                    {Math.abs(balanceSheet.balanceCheck) < 0.01 
                      ? '✓ Assets = Liabilities + Equity (Balanced)' 
                      : `⚠ Difference: ${formatCurrency(balanceSheet.balanceCheck)}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      {expenseAnalytics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Expense Analysis</h3>
            <p className="text-sm text-gray-500">Breakdown by category type</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {expenseAnalytics.typeBreakdown.map((expense: any) => (
                <div key={expense.type} className="text-center p-4 border rounded-lg">
                  <h5 className="font-semibold text-gray-900 capitalize mb-1">
                    {expense.type.replace('_', ' ').toLowerCase()}
                  </h5>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(expense.total_amount)}</p>
                  <p className="text-sm text-gray-500">{expense.expense_count} transactions</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
