import { Plus, Package, AlertTriangle, Search, Edit, Trash2, TrendingDown, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { DeleteItemButton } from './components/DeleteItemButton'

// Get comprehensive inventory data from database
async function getInventoryData() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  try {
    const [items, categories, suppliers, inventoryLogs, recentActivity, monthlyUsage] = await Promise.all([
      // Get all inventory items with detailed information
      prisma.item.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          },
          supplier: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          inventoryLogs: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      // Get categories for filtering
      prisma.category.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      // Get suppliers
      prisma.supplier.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      // Get recent inventory logs for activity tracking
      prisma.inventoryLog.findMany({
        take: 20,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          item: {
            select: {
              name: true,
              unit: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Get recent activity for dashboard
      prisma.inventoryLog.findMany({
        where: {
          createdAt: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          item: {
            select: {
              name: true,
              unit: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Get monthly usage statistics
      prisma.inventoryLog.findMany({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          type: 'STOCK_OUT'
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

    // Calculate comprehensive inventory statistics
    const totalItems = items.length
    const activeItems = items.filter(item => item.isActive).length
    const lowStockItems = items.filter(item => item.currentStock <= item.reorderLevel)
    const outOfStockItems = items.filter(item => item.currentStock === 0)
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0)
    
    // Calculate monthly usage value
    const monthlyUsageValue = monthlyUsage.reduce((sum, log) => {
      return sum + (Math.abs(log.quantity) * log.item.costPrice)
    }, 0)
    
    // Calculate wastage (WASTE type logs)
    const wastageValue = inventoryLogs
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => {
        const item = items.find(i => i.id === log.itemId)
        return sum + (Math.abs(log.quantity) * (item?.costPrice || 0))
      }, 0)
      
    // Group items by category for analysis
    const categoryAnalysis = categories.map(category => {
      const categoryItems = items.filter(item => item.categoryId === category.id)
      const categoryValue = categoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0)
      const categoryLowStock = categoryItems.filter(item => item.currentStock <= item.reorderLevel).length
      
      return {
        category: category.name,
        itemCount: categoryItems.length,
        totalValue: categoryValue,
        lowStockCount: categoryLowStock,
        averageValue: categoryItems.length > 0 ? categoryValue / categoryItems.length : 0
      }
    })

    return { 
      items, 
      categories, 
      suppliers,
      inventoryLogs,
      recentActivity,
      stats: {
        totalItems,
        activeItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalValue,
        monthlyUsageValue,
        wastageValue,
        averageItemValue: totalItems > 0 ? totalValue / totalItems : 0
      },
      categoryAnalysis,
      lowStockItems,
      outOfStockItems
    }
  } catch (error) {
    console.error('Inventory data fetch error:', error)
    return { 
      items: [], 
      categories: [], 
      suppliers: [],
      inventoryLogs: [],
      recentActivity: [],
      stats: {
        totalItems: 0,
        activeItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0,
        monthlyUsageValue: 0,
        wastageValue: 0,
        averageItemValue: 0
      },
      categoryAnalysis: [],
      lowStockItems: [],
      outOfStockItems: []
    }
  }
}

interface InventoryPageProps {
  // Define proper types for our data
}

type ItemWithRelations = {
  id: string
  name: string
  sku: string
  description: string | null
  unit: string
  costPrice: number
  sellingPrice: number | null
  reorderLevel: number
  currentStock: number
  isActive: boolean
  categoryId: string
  supplierId: string | null
  createdAt: Date
  updatedAt: Date
  category: { name: string } | null
  supplier: { name: string; phone: string | null; email: string | null } | null
  inventoryLogs: Array<{
    id: string
    createdAt: Date
    userId: string
    itemId: string
    type: any
    quantity: number
    previousStock: number
    newStock: number
    reason: string | null
    reference: string | null
    user: { name: string }
  }>
}

export default async function InventoryPage() {
  const { 
    items, 
    categories, 
    suppliers,
    inventoryLogs,
    recentActivity,
    stats, 
    categoryAnalysis,
    lowStockItems,
    outOfStockItems 
  } = await getInventoryData()
  
  // Type assertion with any to bypass TypeScript issues
  const typedItems = items as any[]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comprehensive Inventory Management</h1>
              <p className="mt-2 text-gray-600">Complete stock tracking, cost management, and balance sheet reporting</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/inventory/usage"
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 transition-colors duration-200"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Daily Expenses
              </Link>
              <Link
                href="/inventory/categories"
                className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-lg text-purple-700 bg-white hover:bg-purple-50 transition-colors duration-200"
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Categories
              </Link>
              <Link
                href="/inventory/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Link>
              <Link
                href="/inventory/adjustment"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <Activity className="w-4 h-4 mr-2" />
                Stock Adjustment
              </Link>
              <Link
                href="/inventory/reports"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Balance Sheet
              </Link>
            </div>
          </div>
        </div>

        {/* Comprehensive Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Avg per item: {formatCurrency(stats.averageItemValue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeItems}</p>
                <p className="text-xs text-gray-500 mt-1">of {stats.totalItems} total</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Usage</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyUsageValue)}</p>
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Stock consumed
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wastage Value</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.wastageValue)}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Cards */}
        {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {stats.lowStockCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">Low Stock Alert</h3>
                    <p className="text-amber-600">{stats.lowStockCount} items need reordering</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-amber-800">{item.name}</span>
                      <span className="text-amber-600">{item.currentStock} {(item as any).unit} (Min: {item.reorderLevel})</span>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-xs text-amber-600">...and {lowStockItems.length - 3} more items</p>
                  )}
                </div>
              </div>
            )}

            {stats.outOfStockCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Out of Stock</h3>
                    <p className="text-red-600">{stats.outOfStockCount} items are out of stock</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {outOfStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-red-800">{item.name}</span>
                      <span className="text-red-600 font-semibold">0 {(item as any).unit}</span>
                    </div>
                  ))}
                  {outOfStockItems.length > 3 && (
                    <p className="text-xs text-red-600">...and {outOfStockItems.length - 3} more items</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Category Analysis</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAnalysis.map((category) => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{category.itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium text-green-600">{formatCurrency(category.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Low Stock:</span>
                      <span className={`font-medium ${category.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {category.lowStockCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search inventory items..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  suppressHydrationWarning
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  suppressHydrationWarning
                >
                  <option value="">All Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stock Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Updated</th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {typedItems.map((item) => {
                  const stockStatus = item.currentStock === 0 ? 'out-of-stock' : 
                                    item.currentStock <= item.reorderLevel ? 'low-stock' : 'in-stock'
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.category?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{item.supplier?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.currentStock} {item.unit}
                        </div>
                        <div className="text-sm text-gray-500">
                          Reorder at: {item.reorderLevel} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.costPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.currentStock * item.costPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          stockStatus === 'out-of-stock' 
                            ? 'bg-red-100 text-red-800'
                            : stockStatus === 'low-stock'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {stockStatus === 'out-of-stock' ? 'Out of Stock' : 
                           stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDateTime(item.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/inventory/edit/${item.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <DeleteItemButton 
                            itemId={item.id} 
                            itemName={item.name}
                            hasRelatedRecords={item.inventoryLogs?.length > 0}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Inventory Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent inventory activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                        <Activity className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.type === 'STOCK_IN' && 'Stock Added'}
                        {log.type === 'STOCK_OUT' && 'Stock Used'}
                        {log.type === 'WASTE' && 'Waste Recorded'}
                        {log.type === 'ADJUSTMENT' && 'Stock Adjusted'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(log.item as any).name}: {Math.abs(log.quantity)} {(log.item as any).unit}
                        {log.user && ` by ${log.user.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                    {log.reason && (
                      <p className="text-xs text-gray-500">{log.reason}</p>
                    )}
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
