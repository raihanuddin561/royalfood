'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Package, Users, AlertTriangle, ChefHat } from 'lucide-react'
import { formatCurrency } from '@/lib/currency-config'

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
  const [periodData, setPeriodData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  // Compute default start/end when view changes or selectedDate changes
  useEffect(() => {
    const date = new Date(selectedDate)
    const pad = (d: number) => String(d).padStart(2, '0')
    const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (viewType === 'weekly') {
      const day = date.getDay()
      const diff = (day + 6) % 7
      const s = new Date(date)
      s.setDate(date.getDate() - diff)
      s.setHours(0, 0, 0, 0)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      e.setHours(23, 59, 59, 999)
      setStartDate(toInput(s))
      setEndDate(toInput(e))
    } else if (viewType === 'monthly') {
      const s = new Date(date.getFullYear(), date.getMonth(), 1)
      s.setHours(0, 0, 0, 0)
      const e = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      e.setHours(23, 59, 59, 999)
      setStartDate(toInput(s))
      setEndDate(toInput(e))
    } else if (viewType === 'yearly') {
      const s = new Date(date.getFullYear(), 0, 1)
      s.setHours(0, 0, 0, 0)
      const e = new Date(date.getFullYear(), 11, 31)
      e.setHours(23, 59, 59, 999)
      setStartDate(toInput(s))
      setEndDate(toInput(e))
    } else {
      // daily
      setStartDate(null)
      setEndDate(null)
    }
  }, [viewType, selectedDate])

  // Reload when relevant inputs change
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewType, startDate, endDate])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      if (viewType === 'daily') {
        // Fetch daily costs via API route (avoid importing server actions into client code)
        try {
          const res = await fetch(`/api/operations/daily-costs?date=${selectedDate}`)
          const result = await res.json()
          if (result?.success && result.dailySummary) setDailySummary(result.dailySummary)
          else setDailySummary(null)
        } catch (err) {
          console.error('Failed to fetch daily costs:', err)
          setDailySummary(null)
        }
      } else {
        // Prefer explicit start/end inputs if user provided them
        let s: Date | null = null
        let e: Date | null = null

        if (startDate) s = new Date(startDate)
        if (endDate) e = new Date(endDate)

        // If either is missing, compute sensible defaults based on selectedDate and viewType
  if (!s || !e) {
          const date = new Date(selectedDate)
          if (viewType === 'weekly') {
            const day = date.getDay()
            const diff = (day + 6) % 7
            s = new Date(date)
            s.setDate(date.getDate() - diff)
            s.setHours(0, 0, 0, 0)
            e = new Date(s)
            e.setDate(s.getDate() + 6)
            e.setHours(23, 59, 59, 999)
          } else if (viewType === 'monthly') {
            s = new Date(date.getFullYear(), date.getMonth(), 1)
            s.setHours(0, 0, 0, 0)
            e = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            e.setHours(23, 59, 59, 999)
          } else { // yearly
            s = new Date(date.getFullYear(), 0, 1)
            s.setHours(0, 0, 0, 0)
            e = new Date(date.getFullYear(), 11, 31)
            e.setHours(23, 59, 59, 999)
          }
        } else {
          // ensure full-day bounds
          s.setHours(0, 0, 0, 0)
          e.setHours(23, 59, 59, 999)
        }

  // Send date-only strings (YYYY-MM-DD) so server can parse them without timezone shifts
        const startStr = new Date(s).toISOString().slice(0, 10)
  const endStr = new Date(e).toISOString().slice(0, 10)
  try {
    const res = await fetch(`/api/operations/period-summary?start=${startStr}&end=${endStr}`)
    const result = await res.json()
    if (result.success) setPeriodData(result.summary)
    else setPeriodData(null)
  } catch (err) {
    console.error('Failed to fetch period summary:', err)
    setPeriodData(null)
  }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Using centralized currency formatting
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
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your restaurant's operations costs, sales, and profitability</p>
        </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {viewType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            ) : (
              <div className="flex space-x-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="date"
                    value={startDate ?? ''}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="date"
                    value={endDate ?? ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
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
                        <span className="text-sm font-medium text-gray-700 capitalize">{usage.type ? usage.type.toLowerCase() : 'unknown'}</span>
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

  {(viewType !== 'daily') && periodData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              {viewType === 'weekly' ? 'Weekly' : viewType === 'monthly' ? 'Monthly' : 'Yearly'} Summary
            </h3>
            <p className="text-sm text-gray-500">
              {periodData.period.start} to {periodData.period.end}
            </p>
          </div>
          <div className="p-6">
            {/* Period Totals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(periodData.totals.sales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(periodData.totals.costs)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${periodData.totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(periodData.totals.profit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(periodData.totals.profitMargin)}</p>
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
                  {periodData.dailyBreakdown.map((day: any, index: number) => (
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
