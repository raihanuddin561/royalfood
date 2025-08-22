import { Plus, Minus, AlertTriangle, Package, Save, ArrowLeft, Trash2, Calendar } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Get data for stock adjustments
async function getAdjustmentData() {
  try {
    const [items, recentAdjustments] = await Promise.all([
      // Get all active inventory items
      prisma.item.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          }
        },
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      // Get recent adjustments and waste records
      prisma.inventoryLog.findMany({
        where: {
          type: {
            in: ['ADJUSTMENT', 'WASTE']
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
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      })
    ])

    // Calculate total waste and adjustment values
    const totalWasteValue = recentAdjustments
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)
    
    const totalAdjustmentValue = recentAdjustments
      .filter(log => log.type === 'ADJUSTMENT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * log.item.costPrice), 0)

    return {
      items,
      recentAdjustments,
      stats: {
        totalWasteValue,
        totalAdjustmentValue,
        totalRecords: recentAdjustments.length,
        wasteRecords: recentAdjustments.filter(log => log.type === 'WASTE').length
      }
    }
  } catch (error) {
    console.error('Adjustment data fetch error:', error)
    return {
      items: [],
      recentAdjustments: [],
      stats: {
        totalWasteValue: 0,
        totalAdjustmentValue: 0,
        totalRecords: 0,
        wasteRecords: 0
      }
    }
  }
}

export default async function StockAdjustmentPage() {
  const { items, recentAdjustments, stats } = await getAdjustmentData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/inventory"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Inventory
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments & Wastage</h1>
              <p className="mt-2 text-gray-600">Adjust inventory levels and record waste for accurate cost tracking</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Waste Value</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalWasteValue)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.wasteRecords} waste records</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Adjustment Value</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAdjustmentValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Stock corrections</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                <p className="text-xs text-gray-500 mt-1">Available for adjustment</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                <p className="text-xs text-gray-500 mt-1">Recent adjustments</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Adjustment Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Quick Stock Adjustment</h2>
              <p className="text-sm text-gray-600 mt-1">Adjust stock levels or record waste</p>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Item
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white">
                    <option value="">Choose an item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - Current: {item.currentStock} {item.unit} - {formatCurrency(item.costPrice)}/{item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Type
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white">
                      <option value="ADJUSTMENT">Stock Adjustment</option>
                      <option value="WASTE">Record Waste</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        <button
                          type="button"
                          className="w-6 h-6 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          className="w-6 h-6 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason/Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the reason for this adjustment..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white resize-none"
                  ></textarea>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Important Notes:</h3>
                      <ul className="mt-2 text-xs text-yellow-700 list-disc list-inside space-y-1">
                        <li>Stock adjustments will immediately update inventory levels</li>
                        <li>Waste records help track loss and improve cost control</li>
                        <li>All adjustments are logged for audit purposes</li>
                        <li>Use negative values to decrease stock, positive to increase</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Adjustment
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Adjustments</h2>
              <p className="text-sm text-gray-600 mt-1">Latest stock adjustments and waste records</p>
            </div>
            <div className="p-6">
              {recentAdjustments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No adjustments yet</h3>
                  <p className="text-gray-500">Stock adjustments and waste records will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentAdjustments.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.type === 'WASTE' 
                            ? 'bg-red-100' 
                            : 'bg-blue-100'
                        }`}>
                          {log.type === 'WASTE' ? (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          ) : (
                            <Package className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.type === 'WASTE' ? 'Waste recorded' : 'Stock adjusted'}: {Math.abs(log.quantity)} {log.item.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            Value: {formatCurrency(Math.abs(log.quantity) * log.item.costPrice)}
                          </p>
                          {log.reason && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              "{log.reason}"
                            </p>
                          )}
                          {log.user && (
                            <p className="text-xs text-gray-400">
                              by {log.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDateTime(log.createdAt)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.type === 'WASTE' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Adjustment Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Adjustments</h2>
            <p className="text-sm text-gray-600 mt-1">Adjust multiple items at once for periodic inventory counts</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Physical Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.category?.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{item.currentStock} {item.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          placeholder={item.currentStock.toString()}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
                Reset All
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                <Save className="w-4 h-4 mr-2" />
                Apply Bulk Adjustments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
