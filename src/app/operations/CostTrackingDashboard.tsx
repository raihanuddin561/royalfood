'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, BarChart3, Activity } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CostMetrics {
  daily: {
    revenue: number
    expenses: number
    profit: number
    orders: number
  }
  weekly: {
    revenue: number
    expenses: number
    profit: number
    trend: number
  }
  monthly: {
    revenue: number
    expenses: number
    profit: number
    trend: number
  }
  yearly: {
    revenue: number
    expenses: number
    profit: number
    trend: number
  }
}

export default function CostTrackingDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [metrics, setMetrics] = useState<CostMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCostMetrics()
  }, [selectedDate])

  const loadCostMetrics = async () => {
    setLoading(true)
    try {
      const today = new Date(selectedDate)
      
      // Daily costs
      const dailyResponse = await fetch(`/api/restaurant-operations/daily-costs?date=${selectedDate}`)
      let dailyData = { revenue: 0, expenses: 0, profit: 0, orders: 0 }
      
      if (dailyResponse.ok) {
        const daily = await dailyResponse.json()
        if (daily.success) {
          dailyData = {
            revenue: daily.dailySummary?.revenue || 0,
            expenses: daily.dailySummary?.costs?.total || 0,
            profit: daily.dailySummary?.profit?.net || 0,
            orders: daily.dailySummary?.transactions?.sales || 0
          }
        }
      }

      // Weekly analysis
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7)
      
      const weeklyResponse = await fetch(`/api/profit-analysis?startDate=${weekStart.toISOString()}&endDate=${today.toISOString()}`)
      let weeklyData = { revenue: 0, expenses: 0, profit: 0, trend: 0 }
      
      if (weeklyResponse.ok) {
        const weekly = await weeklyResponse.json()
        weeklyData = {
          revenue: weekly.summary?.totalRevenue || 0,
          expenses: weekly.summary?.effectiveTotalExpenses || 0,
          profit: weekly.summary?.netProfit || 0,
          trend: 0 // Would calculate trend vs previous week
        }
      }

      // Monthly analysis
      const monthStart = new Date(today)
      monthStart.setMonth(today.getMonth() - 1)
      
      const monthlyResponse = await fetch(`/api/profit-analysis?startDate=${monthStart.toISOString()}&endDate=${today.toISOString()}`)
      let monthlyData = { revenue: 0, expenses: 0, profit: 0, trend: 0 }
      
      if (monthlyResponse.ok) {
        const monthly = await monthlyResponse.json()
        monthlyData = {
          revenue: monthly.summary?.totalRevenue || 0,
          expenses: monthly.summary?.effectiveTotalExpenses || 0,
          profit: monthly.summary?.netProfit || 0,
          trend: 0 // Would calculate trend vs previous month
        }
      }

      // Yearly analysis
      const yearStart = new Date(today)
      yearStart.setFullYear(today.getFullYear() - 1)
      
      const yearlyResponse = await fetch(`/api/profit-analysis?startDate=${yearStart.toISOString()}&endDate=${today.toISOString()}`)
      let yearlyData = { revenue: 0, expenses: 0, profit: 0, trend: 0 }
      
      if (yearlyResponse.ok) {
        const yearly = await yearlyResponse.json()
        yearlyData = {
          revenue: yearly.summary?.totalRevenue || 0,
          expenses: yearly.summary?.effectiveTotalExpenses || 0,
          profit: yearly.summary?.netProfit || 0,
          trend: 0 // Would calculate trend vs previous year
        }
      }

      setMetrics({
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData
      })
    } catch (error) {
      console.error('Error loading cost metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-4" />
        <p>Unable to load cost metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <p className="text-sm text-gray-600">Cost tracking as of {formatDate(selectedDate)}</p>
      </div>

      {/* Daily Metrics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance - {formatDate(selectedDate)}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.daily.revenue)}</p>
            <p className="text-sm text-gray-600">Revenue</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Package className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.daily.expenses)}</p>
            <p className="text-sm text-gray-600">Expenses</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${metrics.daily.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.daily.profit)}
            </p>
            <p className="text-sm text-gray-600">Profit</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{metrics.daily.orders}</p>
            <p className="text-sm text-gray-600">Orders</p>
          </div>
        </div>
      </div>

      {/* Period Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Last 7 Days</h4>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">{formatCurrency(metrics.weekly.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">{formatCurrency(metrics.weekly.expenses)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Net Profit</span>
                <span className={`font-semibold ${metrics.weekly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.weekly.profit)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Daily avg: {formatCurrency(metrics.weekly.profit / 7)}
            </div>
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Last 30 Days</h4>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">{formatCurrency(metrics.monthly.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">{formatCurrency(metrics.monthly.expenses)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Net Profit</span>
                <span className={`font-semibold ${metrics.monthly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.monthly.profit)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Daily avg: {formatCurrency(metrics.monthly.profit / 30)}
            </div>
          </div>
        </div>

        {/* Yearly */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Last 12 Months</h4>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">{formatCurrency(metrics.yearly.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">{formatCurrency(metrics.yearly.expenses)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Net Profit</span>
                <span className={`font-semibold ${metrics.yearly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.yearly.profit)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Monthly avg: {formatCurrency(metrics.yearly.profit / 12)}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Profitability Analysis</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Daily profit margin:</span>
                <span className={`font-medium ${
                  metrics.daily.revenue > 0 && (metrics.daily.profit / metrics.daily.revenue) * 100 >= 20 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {metrics.daily.revenue > 0 ? ((metrics.daily.profit / metrics.daily.revenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Weekly trend:</span>
                <span className={`font-medium ${metrics.weekly.profit >= metrics.daily.profit * 7 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.weekly.profit >= metrics.daily.profit * 7 ? 'Above average' : 'Below average'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Monthly outlook:</span>
                <span className={`font-medium ${metrics.monthly.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.monthly.profit > 0 ? 'Profitable' : 'Loss making'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Cost Efficiency</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Daily expense ratio:</span>
                <span className="font-medium">
                  {metrics.daily.revenue > 0 ? ((metrics.daily.expenses / metrics.daily.revenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue per order:</span>
                <span className="font-medium">
                  {metrics.daily.orders > 0 ? formatCurrency(metrics.daily.revenue / metrics.daily.orders) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Year-over-year growth:</span>
                <span className={`font-medium ${metrics.yearly.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.yearly.trend >= 0 ? '+' : ''}{metrics.yearly.trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
