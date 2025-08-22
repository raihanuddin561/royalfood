'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Package, Calendar, ChevronDown, Download, Eye, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getDailyProfitAnalysis, getMonthlyProfitTrends, getCategoryProfitAnalysis } from '@/app/actions/sales'
import { Button, Loading } from '@/components/ui/Modal'
import { Notification } from '@/components/ui/Notification'

interface DailyProfitData {
  date: string
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  salesCount: number
  itemsSold: number
}

interface ItemProfitData {
  itemId: string
  itemName: string
  category: string
  unit: string
  quantitySold: number
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  averagePrice: number
}

interface CategoryProfitData {
  categoryName: string
  itemCount: number
  totalQuantity: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
}

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' }
]

export default function ProfitsPage() {
  const [selectedRange, setSelectedRange] = useState('today')
  const [dailyData, setDailyData] = useState<DailyProfitData[]>([])
  const [itemData, setItemData] = useState<ItemProfitData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryProfitData[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Load profit data
  useEffect(() => {
    loadProfitData()
  }, [selectedRange])

  const loadProfitData = async () => {
    setLoading(true)
    try {
      const [dailyResult, categoryResult] = await Promise.all([
        getDailyProfitAnalysis(selectedRange),
        getCategoryProfitAnalysis(selectedRange)
      ])

      if (dailyResult.success && dailyResult.data) {
        setDailyData(dailyResult.data.daily || [])
        setItemData(dailyResult.data.items || [])
      }

      if (categoryResult.success && categoryResult.data) {
        setCategoryData(categoryResult.data || [])
      }

      if (!dailyResult.success || !categoryResult.success) {
        setNotification({
          type: 'error',
          message: 'Failed to load some profit data'
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to load profit data'
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary metrics
  const summaryMetrics = dailyData.reduce(
    (acc, day) => ({
      totalRevenue: acc.totalRevenue + day.revenue,
      totalCost: acc.totalCost + day.cost,
      totalProfit: acc.totalProfit + day.profit,
      totalSales: acc.totalSales + day.salesCount,
      totalItems: acc.totalItems + day.itemsSold
    }),
    { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalSales: 0, totalItems: 0 }
  )

  const overallProfitMargin = summaryMetrics.totalRevenue > 0 
    ? (summaryMetrics.totalProfit / summaryMetrics.totalRevenue) * 100 
    : 0

  // Top performing items (by profit)
  const topItems = [...itemData]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)

  // Worst performing items (by profit margin)
  const lowMarginItems = [...itemData]
    .filter(item => item.profit > 0)
    .sort((a, b) => a.profitMargin - b.profitMargin)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profit Analysis</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive profit tracking with item-level and category analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summaryMetrics.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">From {summaryMetrics.totalSales} sales</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Profit</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summaryMetrics.totalProfit)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={overallProfitMargin >= 20 ? "text-green-600" : overallProfitMargin >= 10 ? "text-yellow-600" : "text-red-600"}>
                {overallProfitMargin.toFixed(1)}% margin
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Items Sold</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summaryMetrics.totalItems.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{itemData.length} different items</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Daily Profit</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(dailyData.length > 0 ? summaryMetrics.totalProfit / dailyData.length : 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Over {dailyData.length} day(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Profit Trend */}
      {dailyData.length > 1 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Daily Profit Trend</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyData.map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(new Date(day.date))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.salesCount} sales • {day.itemsSold} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(day.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={day.profitMargin >= 20 ? "text-green-600" : day.profitMargin >= 10 ? "text-yellow-600" : "text-red-600"}>
                          {day.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category Performance and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Performance</h3>
          </div>
          <div className="p-6">
            {categoryData.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No category data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.categoryName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                      <span className="text-sm text-gray-500">{category.itemCount} items</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-medium text-gray-900">{formatCurrency(category.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Profit</p>
                        <p className="font-medium text-green-600">{formatCurrency(category.totalProfit)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Margin</p>
                        <p className={`font-medium ${category.profitMargin >= 20 ? "text-green-600" : category.profitMargin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                          {category.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: summaryMetrics.totalRevenue > 0 
                              ? `${(category.totalRevenue / summaryMetrics.totalRevenue) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Profit Makers</h3>
          </div>
          <div className="p-6">
            {topItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No sales data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-yellow-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-xs text-gray-500">{item.category} • {item.quantitySold} {item.unit} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{formatCurrency(item.profit)}</p>
                      <p className="text-xs text-gray-500">{item.profitMargin.toFixed(1)}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Items Detailed Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Item-wise Profit Analysis</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Items</option>
                <option>High Profit</option>
                <option>Low Margin</option>
                <option>High Volume</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {itemData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No item sales data available for selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemData.map((item) => (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantitySold} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.revenue)}
                        <div className="text-xs text-gray-500">
                          Avg: {formatCurrency(item.averagePrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={item.profitMargin >= 20 ? "text-green-600 font-medium" : item.profitMargin >= 10 ? "text-yellow-600" : "text-red-600"}>
                          {item.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Margin Alert */}
      {lowMarginItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Low Margin Items</h3>
          <p className="text-sm text-yellow-700 mb-3">
            These items have the lowest profit margins. Consider reviewing pricing or costs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowMarginItems.map((item) => (
              <div key={item.itemId} className="bg-white p-3 rounded border">
                <p className="font-medium text-gray-900">{item.itemName}</p>
                <p className="text-sm text-gray-600">{item.category}</p>
                <p className="text-sm text-yellow-700 font-medium">
                  {item.profitMargin.toFixed(1)}% margin • {formatCurrency(item.profit)} profit
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
