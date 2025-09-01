'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, AlertTriangle, Package, Save, ArrowLeft, Trash2, Calendar } from 'lucide-react'
import QuickAdjustmentForm from './QuickAdjustmentForm'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface AdjustmentPageClientProps {
  initialItems: any[]
  initialRecentAdjustments: any[]
  initialStats: any
}

export default function AdjustmentPageClient({ 
  initialItems, 
  initialRecentAdjustments, 
  initialStats 
}: AdjustmentPageClientProps) {
  const [items, setItems] = useState(initialItems)
  const [recentAdjustments, setRecentAdjustments] = useState(initialRecentAdjustments)
  const [stats, setStats] = useState(initialStats)
  const [refreshing, setRefreshing] = useState(false)

  const refreshData = async () => {
    setRefreshing(true)
    try {
      // Fetch updated items
      const itemsRes = await fetch('/api/inventory/items')
      const itemsData = await itemsRes.json()
      
      // Fetch recent adjustments
      const adjustmentsRes = await fetch('/api/inventory/adjustments')
      const adjustmentsData = await adjustmentsRes.json()
      
      if (itemsRes.ok && adjustmentsRes.ok) {
        setItems(itemsData)
        setRecentAdjustments(adjustmentsData.adjustments || [])
        setStats(adjustmentsData.stats || initialStats)
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleAdjustmentSuccess = () => {
    refreshData()
  }

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
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
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
              <QuickAdjustmentForm items={items} onSuccess={handleAdjustmentSuccess} />

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Important Notes:</h3>
                    <ul className="mt-2 text-xs text-yellow-700 list-disc list-inside space-y-1">
                      <li>Stock adjustments will immediately update inventory levels</li>
                      <li>Waste records help track loss and improve cost control</li>
                      <li>All adjustments are logged for audit purposes</li>
                      <li>Enter positive amounts - the system handles increase/decrease automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
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
                  {recentAdjustments.map((log: any) => (
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
                            Value: {formatCurrency(Math.abs(log.quantity) * (log.item.costPrice || 0))}
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
      </div>
    </div>
  )
}
