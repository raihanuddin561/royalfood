'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, AlertTriangle, ChefHat } from 'lucide-react'
import { getDailyCosts, getPeriodSummary } from '@/app/actions/restaurant-operations'

interface DailySummary {
  date: string
  revenue: number
  costs: {
    stock: number
    employee: number
    operational: number
    total: number
  }
  profit: {
    gross: number
    margin: number
  }
  transactions: {
    sales: number
    stockUsage: number
  }
  breakdown: {
    stockUsage: Array<{
      type: string
      cost: number
      count: number
    }>
    operationalCosts: Array<{
      category: any
      cost: number
    }>
  }
}

export default function DailyOperationsDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    loadDashboardData()
  }, [selectedDate, viewType])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      if (viewType === 'daily') {
        const result = await getDailyCosts(new Date(selectedDate))
        if (result.success) {
          setDailySummary(result.dailySummary)
        }
      } else {
        const date = new Date(selectedDate)
        let startDate: Date
        let endDate: Date

        if (viewType === 'weekly') {
          // Get start of week (Monday)
          startDate = new Date(date)
          startDate.setDate(date.getDate() - date.getDay() + 1)
          endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + 6)
        } else { // monthly
          startDate = new Date(date.getFullYear(), date.getMonth(), 1)
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        }

        const result = await getPeriodSummary(startDate, endDate)
        if (result.success) {
          setWeeklyData(result.summary)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`
  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`

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
          <h1 className="text-3xl font-bold text-gray-900">Daily Operations Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your restaurant's daily costs, sales, and profitability</p>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {viewType === 'daily' && dailySummary && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(dailySummary.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{dailySummary.transactions.sales} sales</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Costs Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Costs</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(dailySummary.costs.total)}</p>
                  <p className="text-xs text-gray-500 mt-1">All expenses</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Profit Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                  <p className={`text-2xl font-bold ${dailySummary.profit.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dailySummary.profit.gross)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatPercentage(dailySummary.profit.margin)} margin</p>
                </div>
                <div className={`w-12 h-12 ${dailySummary.profit.gross >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                  <TrendingUp className={`w-6 h-6 ${dailySummary.profit.gross >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>

            {/* Stock Usage Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Costs</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(dailySummary.costs.stock)}</p>
                  <p className="text-xs text-gray-500 mt-1">{dailySummary.transactions.stockUsage} usages</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Structure */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Stock Usage</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{formatCurrency(dailySummary.costs.stock)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Employee Costs</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">{formatCurrency(dailySummary.costs.employee)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Operational</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{formatCurrency(dailySummary.costs.operational)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Costs</span>
                    <span className="text-base font-bold text-red-600">{formatCurrency(dailySummary.costs.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Usage Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Stock Usage Details</h3>
              </div>
              <div className="p-6 space-y-4">
                {dailySummary.breakdown.stockUsage.map((usage, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      {usage.type === 'RECIPE' && <ChefHat className="w-4 h-4 text-green-600 mr-2" />}
                      {usage.type === 'WASTAGE' && <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                      {usage.type === 'OTHER' && <Package className="w-4 h-4 text-gray-600 mr-2" />}
                      <div>
                        <span className="text-sm font-medium text-gray-700 capitalize">{usage.type.toLowerCase()}</span>
                        <p className="text-xs text-gray-500">{usage.count} transactions</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(usage.cost)}</span>
                  </div>
                ))}
                {dailySummary.breakdown.stockUsage.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">No stock usage recorded today</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {(viewType === 'weekly' || viewType === 'monthly') && weeklyData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              {viewType === 'weekly' ? 'Weekly' : 'Monthly'} Summary
            </h3>
            <p className="text-sm text-gray-500">
              {weeklyData.period.start} to {weeklyData.period.end}
            </p>
          </div>
          <div className="p-6">
            {/* Period Totals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(weeklyData.totals.sales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(weeklyData.totals.costs)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${weeklyData.totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(weeklyData.totals.profit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(weeklyData.totals.profitMargin)}</p>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Costs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operational</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyData.dailyBreakdown.map((day: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(day.sales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {formatCurrency(day.costs.stock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                        {formatCurrency(day.costs.employee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        {formatCurrency(day.costs.operational)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        day.profit.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(day.profit.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(day.profit.margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
