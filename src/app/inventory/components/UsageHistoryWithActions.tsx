'use client'

import { useState } from 'react'
import { Edit, Trash2, Package, AlertTriangle, Activity, ChefHat } from 'lucide-react'
import { EditStockUsageModal } from './EditStockUsageModal'
import { deleteStockUsage } from '@/app/actions/restaurant-operations'
import { useNotification } from '@/components/ui/Notification'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface StockUsage {
  id: string
  quantity: number
  totalCost: number
  reason: string
  description: string | null
  usageDate: Date
  createdAt: Date
  itemId: string
  menuItemId: string | null
  item: {
    name: string
    unit: string
    costPrice: number
    currentStock: number
  }
  menuItem?: {
    name: string
  } | null
}

interface UsageHistoryWithActionsProps {
  usages: StockUsage[]
  title: string
  description?: string
  showActions?: boolean
}

export default function UsageHistoryWithActions({ 
  usages, 
  title, 
  description,
  showActions = true 
}: UsageHistoryWithActionsProps) {
  const { showNotification } = useNotification()
  const router = useRouter()
  const [editingUsage, setEditingUsage] = useState<StockUsage | null>(null)
  const [deletingUsageId, setDeletingUsageId] = useState<string | null>(null)

  const handleDelete = async (usage: StockUsage) => {
    if (!confirm(`Are you sure you want to delete this stock usage record?\n\nThis will restore ${usage.quantity} ${usage.item.unit} to ${usage.item.name} inventory.`)) {
      return
    }

    setDeletingUsageId(usage.id)
    
    try {
      const result = await deleteStockUsage(usage.id)
      
      if (result.success) {
        showNotification('success', result.message || 'Stock usage deleted successfully')
        router.refresh() // Refresh the page to update the data
      } else {
        showNotification('error', result.message || 'Failed to delete stock usage')
      }
    } catch (error) {
      console.error('Error deleting stock usage:', error)
      showNotification('error', 'Failed to delete stock usage')
    } finally {
      setDeletingUsageId(null)
    }
  }

  const handleEditSuccess = () => {
    router.refresh() // Refresh the page to update the data
  }

  const getUsageIcon = (reason: string) => {
    switch (reason) {
      case 'PRODUCTION':
        return <Package className="w-4 h-4 text-green-600" />
      case 'WASTE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-orange-600" />
    }
  }

  const getUsageColor = (reason: string) => {
    switch (reason) {
      case 'PRODUCTION':
        return 'bg-green-100'
      case 'WASTE':
        return 'bg-red-100'
      default:
        return 'bg-orange-100'
    }
  }

  if (usages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No usage records found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {usages.map((usage) => (
              <div key={usage.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getUsageColor(usage.reason)}`}>
                    {getUsageIcon(usage.reason)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{usage.item.name}</p>
                    <p className="text-xs text-gray-500">
                      Quantity: {usage.quantity} {usage.item.unit} • {usage.reason}
                      {usage.menuItem && ` • ${usage.menuItem.name}`}
                    </p>
                    {usage.description && (
                      <p className="text-xs text-gray-400 mt-1">{usage.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Usage Date: {new Date(usage.usageDate).toLocaleDateString()} • 
                      Recorded: {formatDateTime(usage.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(usage.totalCost)}</p>
                    <p className="text-xs text-gray-500">${usage.item.costPrice.toFixed(2)}/{usage.item.unit}</p>
                  </div>
                  {showActions && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingUsage(usage)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="Edit usage"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(usage)}
                        disabled={deletingUsageId === usage.id}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Delete usage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUsage && (
        <EditStockUsageModal
          isOpen={true}
          onClose={() => setEditingUsage(null)}
          onSuccess={handleEditSuccess}
          usage={editingUsage}
        />
      )}
    </>
  )
}