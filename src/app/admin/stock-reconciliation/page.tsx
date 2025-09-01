'use client'

import { useState, useEffect } from 'react'
import { Package, AlertTriangle, CheckCircle, RefreshCw, Eye } from 'lucide-react'
import { reconcileAllStock, fixStockDiscrepancies, getRecentStockMovements } from '@/app/actions/stock-reconciliation'
import type { StockDiscrepancy } from '@/app/actions/stock-reconciliation'
import { toast } from '@/components/ui/Toast'

export default function StockReconciliationPage() {
  const [discrepancies, setDiscrepancies] = useState<StockDiscrepancy[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState<string | null>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    runReconciliation()
  }, [])

  const runReconciliation = async () => {
    setLoading(true)
    try {
      const result = await reconcileAllStock()
      if (result.success) {
        setDiscrepancies(result.discrepancies)
        setTotalItems(result.totalItems)
        
        if (result.discrepancies.length === 0) {
          toast.success(
            'Perfect Stock Balance',
            `All ${result.totalItems} items have accurate stock calculations. No discrepancies found.`
          )
        } else {
          toast.info(
            'Reconciliation Complete',
            `Found ${result.discrepancies.length} items with discrepancies out of ${result.totalItems} total items. Review and fix as needed.`
          )
        }
      } else {
        console.error('Reconciliation failed:', result.error)
        toast.error(
          'Reconciliation Failed',
          result.error || 'Unable to run stock reconciliation. Please try again.'
        )
      }
    } catch (error) {
      console.error('Error running reconciliation:', error)
      toast.error(
        'System Error',
        'An unexpected error occurred during reconciliation. Please check your network connection and try again.'
      )
    }
    setLoading(false)
  }

  const handleFixSelected = async () => {
    if (selectedItems.length === 0) return
    
    setFixing(true)
    try {
      const result = await fixStockDiscrepancies(selectedItems)
      if (result.success) {
        toast.success(
          'Stock Reconciliation Complete',
          `Successfully fixed ${result.fixed?.length || 0} discrepancies. Stock levels updated.`
        )
        setSelectedItems([])
        await runReconciliation() // Refresh data
      } else {
        toast.error(
          'Reconciliation Failed',
          result.error || 'An error occurred while fixing discrepancies'
        )
      }
    } catch (error) {
      console.error('Error fixing discrepancies:', error)
      toast.error(
        'System Error',
        'Unable to fix discrepancies. Please try again or contact support.'
      )
    }
    setFixing(false)
  }

  const handleShowLogs = async (itemId: string) => {
    setShowLogs(itemId)
    try {
      const result = await getRecentStockMovements(itemId, 20)
      if (result.success) {
        setRecentLogs(result.logs)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === discrepancies.length 
        ? []
        : discrepancies.map(d => d.itemId)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Running stock reconciliation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stock Reconciliation</h1>
          <p className="mt-2 text-gray-600">
            Compare recorded stock with computed stock from inventory logs
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Discrepancies</p>
                <p className="text-2xl font-bold text-gray-900">{discrepancies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Accurate Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems - discrepancies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {discrepancies.length === 0 ? 'All Good' : 'Needs Attention'}
                </p>
              </div>
              <button
                onClick={runReconciliation}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {discrepancies.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-amber-800">Stock Discrepancies Found</h3>
                <p className="text-sm text-amber-700">
                  {discrepancies.length} items have discrepancies between recorded and computed stock.
                </p>
              </div>
              <div className="flex space-x-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === discrepancies.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All</span>
                </label>
                <button
                  onClick={handleFixSelected}
                  disabled={selectedItems.length === 0 || fixing}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-md"
                >
                  {fixing ? 'Fixing...' : `Fix Selected (${selectedItems.length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discrepancies Table */}
        {discrepancies.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Stock Discrepancies</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Computed Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discrepancies.map((item) => (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.itemId)}
                          onChange={() => toggleSelectItem(item.itemId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.currentStock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.computedStock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          item.difference > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleShowLogs(item.itemId)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Stock Levels Are Accurate!</h2>
            <p className="text-gray-600">
              All {totalItems} inventory items have matching computed and recorded stock levels.
            </p>
          </div>
        )}

        {/* Logs Modal */}
        {showLogs && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Stock Movements</h3>
                <button
                  onClick={() => setShowLogs(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="px-6 py-4 max-h-80 overflow-y-auto">
                {recentLogs.length > 0 ? (
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.type} • {log.quantity} {log.itemUnit}
                            </p>
                            <p className="text-xs text-gray-600">
                              {log.previousStock} → {log.newStock} • {log.reason}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">{log.userName}</p>
                          </div>
                        </div>
                        {log.reference && (
                          <p className="text-xs text-gray-500 mt-1">Ref: {log.reference}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent movements found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Best Practices */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Stock Management Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">✅ Correct Workflow</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create Purchase Orders for new stock</li>
                <li>• Receive purchases to update inventory</li>
                <li>• Use sales system to reduce stock</li>
                <li>• Make manual adjustments only when necessary</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-800 mb-2">❌ Avoid These</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Creating duplicate items with same name</li>
                <li>• Manual stock addition for existing items</li>
                <li>• Both purchase orders AND manual stock addition</li>
                <li>• Editing stock directly without inventory logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
