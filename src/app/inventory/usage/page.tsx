import Link from 'next/link'
import { ArrowLeft, Activity, Package, AlertTriangle, DollarSign } from 'lucide-react'
import StandaloneStockUsageForm from '../components/StandaloneStockUsageForm'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'

// Get recent stock usage data for display
async function getStockUsageData() {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const [todayUsage, weeklyUsage, recentUsage, totalUsageValue] = await Promise.all([
      // Today's stock usage
      prisma.stockUsage.findMany({
        where: {
          createdAt: {
            gte: startOfDay
          }
        },
        include: {
          item: {
            select: {
              name: true,
              unit: true,
              costPrice: true
            }
          },
          menuItem: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Weekly stock usage
      prisma.stockUsage.findMany({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        },
        include: {
          item: {
            select: {
              name: true,
              unit: true,
              costPrice: true
            }
          }
        }
      }),
      
      // Recent usage history
      prisma.stockUsage.findMany({
        take: 20,
        include: {
          item: {
            select: {
              name: true,
              unit: true,
              costPrice: true
            }
          },
          menuItem: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Calculate total usage value for this month
      prisma.stockUsage.aggregate({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1)
          }
        },
        _sum: {
          totalCost: true
        }
      })
    ])

    // Calculate statistics
    const todayStats = {
      totalCost: todayUsage.reduce((sum, usage) => sum + usage.totalCost, 0),
      recipeUsage: todayUsage.filter(u => u.usageType === 'RECIPE').reduce((sum, usage) => sum + usage.totalCost, 0),
      wastage: todayUsage.filter(u => u.usageType === 'WASTAGE').reduce((sum, usage) => sum + usage.totalCost, 0),
      otherUsage: todayUsage.filter(u => u.usageType === 'OTHER').reduce((sum, usage) => sum + usage.totalCost, 0),
      count: todayUsage.length
    }

    const weeklyStats = {
      totalCost: weeklyUsage.reduce((sum, usage) => sum + usage.totalCost, 0),
      recipeUsage: weeklyUsage.filter(u => u.usageType === 'RECIPE').reduce((sum, usage) => sum + usage.totalCost, 0),
      wastage: weeklyUsage.filter(u => u.usageType === 'WASTAGE').reduce((sum, usage) => sum + usage.totalCost, 0),
      otherUsage: weeklyUsage.filter(u => u.usageType === 'OTHER').reduce((sum, usage) => sum + usage.totalCost, 0),
      count: weeklyUsage.length
    }

    return {
      todayUsage,
      recentUsage,
      todayStats,
      weeklyStats,
      monthlyTotal: totalUsageValue._sum.totalCost || 0
    }
  } catch (error) {
    console.error('Stock usage data fetch error:', error)
    return {
      todayUsage: [],
      recentUsage: [],
      todayStats: { totalCost: 0, recipeUsage: 0, wastage: 0, otherUsage: 0, count: 0 },
      weeklyStats: { totalCost: 0, recipeUsage: 0, wastage: 0, otherUsage: 0, count: 0 },
      monthlyTotal: 0
    }
  }
}

export default async function StockUsagePage() {
  const { todayUsage, recentUsage, todayStats, weeklyStats, monthlyTotal } = await getStockUsageData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/inventory"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Inventory
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Stock Usage & Expenses</h1>
              <p className="mt-2 text-gray-600">Record and track daily stock consumption for cost analysis</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayStats.totalCost)}</p>
                <p className="text-xs text-gray-500 mt-1">{todayStats.count} transactions</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recipe Usage</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(todayStats.recipeUsage)}</p>
                <p className="text-xs text-gray-500 mt-1">Production costs</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wastage</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(todayStats.wastage)}</p>
                <p className="text-xs text-gray-500 mt-1">Lost inventory</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Other Usage</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(todayStats.otherUsage)}</p>
                <p className="text-xs text-gray-500 mt-1">Miscellaneous</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(weeklyStats.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipe Usage</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(weeklyStats.recipeUsage)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wastage</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(weeklyStats.wastage)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Other</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(weeklyStats.otherUsage)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Usage Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Record Stock Usage</h2>
              <p className="text-sm text-gray-600">Track daily stock consumption and expenses</p>
            </div>
            <div className="p-6">
              <StandaloneStockUsageForm />
            </div>
          </div>

          {/* Today's Usage History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Today's Usage</h2>
              <p className="text-sm text-gray-600">Recent stock consumption records</p>
            </div>
            <div className="p-6">
              {todayUsage.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No stock usage recorded today</p>
                  <p className="text-sm text-gray-400">Start recording your daily expenses</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {todayUsage.map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          usage.usageType === 'RECIPE' 
                            ? 'bg-green-100' 
                            : usage.usageType === 'WASTAGE' 
                              ? 'bg-red-100' 
                              : 'bg-orange-100'
                        }`}>
                          {usage.usageType === 'RECIPE' ? (
                            <Package className="w-4 h-4 text-green-600" />
                          ) : usage.usageType === 'WASTAGE' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Activity className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{usage.item.name}</p>
                          <p className="text-xs text-gray-500">
                            {usage.quantity} {usage.item.unit} • {usage.usageType}
                            {usage.menuItem && ` • ${usage.menuItem.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(usage.totalCost)}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(usage.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Usage History */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Stock Usage History</h2>
            <p className="text-sm text-gray-600">Complete log of recent stock consumption</p>
          </div>
          <div className="p-6">
            {recentUsage.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No usage history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsage.map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        usage.usageType === 'RECIPE' 
                          ? 'bg-green-100' 
                          : usage.usageType === 'WASTAGE' 
                            ? 'bg-red-100' 
                            : 'bg-orange-100'
                      }`}>
                        {usage.usageType === 'RECIPE' ? (
                          <Package className="w-4 h-4 text-green-600" />
                        ) : usage.usageType === 'WASTAGE' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{usage.item.name}</p>
                        <p className="text-xs text-gray-500">
                          {usage.quantity} {usage.item.unit} • {usage.usageType}
                          {usage.menuItem && ` • ${usage.menuItem.name}`}
                        </p>
                        {usage.description && (
                          <p className="text-xs text-gray-400 mt-1">{usage.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(usage.totalCost)}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(usage.createdAt)}</p>
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
