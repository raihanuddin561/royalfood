'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertTriangle, Package, ChefHat } from 'lucide-react'
import { updateStockUsage } from '@/app/actions/restaurant-operations'
import { useNotification } from '@/components/ui/Notification'

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

interface MenuItem {
  id: string
  name: string
}

interface EditStockUsageModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  usage: StockUsage
}

export function EditStockUsageModal({ isOpen, onClose, onSuccess, usage }: EditStockUsageModalProps) {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  
  // Form state
  const [quantity, setQuantity] = useState(usage.quantity.toString())
  const [usageType, setUsageType] = useState<'RECIPE' | 'WASTAGE' | 'OTHER'>(
    usage.reason === 'PRODUCTION' ? 'RECIPE' : 
    usage.reason === 'WASTE' ? 'WASTAGE' : 'OTHER'
  )
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(usage.menuItemId || '')
  const [description, setDescription] = useState(usage.description || '')
  const [usageDate, setUsageDate] = useState(() => {
    const date = new Date(usage.usageDate)
    return date.toISOString().slice(0, 10)
  })

  // Fetch menu items
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        const response = await fetch('/api/menu-items')
        if (response.ok) {
          const data = await response.json()
          setMenuItems(data)
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error)
      }
    }

    if (isOpen) {
      fetchMenuItems()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(usage.quantity.toString())
      setUsageType(usage.reason === 'PRODUCTION' ? 'RECIPE' : usage.reason === 'WASTE' ? 'WASTAGE' : 'OTHER')
      setSelectedMenuItemId(usage.menuItemId || '')
      setDescription(usage.description || '')
      setUsageDate(new Date(usage.usageDate).toISOString().slice(0, 10))
    }
  }, [isOpen, usage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quantity || isNaN(parseFloat(quantity))) {
      showNotification('error', 'Please enter a valid quantity')
      return
    }

    if (usageType === 'RECIPE' && !selectedMenuItemId) {
      showNotification('error', 'Please select a menu item for recipe usage')
      return
    }

    const newQuantity = parseFloat(quantity)
    const quantityDifference = newQuantity - usage.quantity
    const availableStock = usage.item.currentStock + usage.quantity // Current stock + what was originally used

    if (newQuantity > availableStock) {
      showNotification('error', `Insufficient stock. Available: ${availableStock} ${usage.item.unit}`)
      return
    }

    setLoading(true)
    
    try {
      const result = await updateStockUsage(usage.id, {
        quantity: newQuantity,
        usageType,
        menuItemId: usageType === 'RECIPE' ? selectedMenuItemId : undefined,
        description: description.trim() || undefined,
        usageDate
      })

      if (result.success) {
        showNotification('success', result.message || 'Stock usage updated successfully')
        onSuccess()
        onClose()
      } else {
        showNotification('error', result.message || 'Failed to update stock usage')
      }
    } catch (error) {
      console.error('Error updating stock usage:', error)
      showNotification('error', 'Failed to update stock usage')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const estimatedCost = parseFloat(quantity) * usage.item.costPrice || 0
  const availableStock = usage.item.currentStock + usage.quantity // Current stock + what was originally used

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Stock Usage</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">{usage.item.name}</h3>
            <p className="text-sm text-gray-600">
              Cost: ${usage.item.costPrice.toFixed(2)} per {usage.item.unit} • 
              Available (including current usage): {availableStock} {usage.item.unit}
            </p>
          </div>

          {/* Usage Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usage Date</label>
            <input
              type="date"
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Usage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Usage Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setUsageType('RECIPE')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border transition-colors ${
                  usageType === 'RECIPE'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChefHat className="w-5 h-5 mr-2" />
                Recipe
              </button>
              
              <button
                type="button"
                onClick={() => setUsageType('WASTAGE')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border transition-colors ${
                  usageType === 'WASTAGE'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Wastage
              </button>
              
              <button
                type="button"
                onClick={() => setUsageType('OTHER')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border transition-colors ${
                  usageType === 'OTHER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-5 h-5 mr-2" />
                Other
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Used</label>
            <div className="flex space-x-2 items-center">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                step="0.01"
                min="0.01"
                max={availableStock}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                {usage.item.unit}
              </div>
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                Original: {usage.quantity} {usage.item.unit} • 
                Available: {availableStock} {usage.item.unit} • 
                Estimated Cost: <span className="font-semibold">${estimatedCost.toFixed(2)}</span>
              </p>
              {parseFloat(quantity) > availableStock && (
                <p className="text-sm text-red-600">
                  Quantity exceeds available stock (including current usage)
                </p>
              )}
            </div>
          </div>

          {/* Menu Item Selection (for Recipe usage) */}
          {usageType === 'RECIPE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Item *
              </label>
              <select
                value={selectedMenuItemId}
                onChange={(e) => setSelectedMenuItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={usageType === 'RECIPE'}
              >
                <option value="">Select menu item...</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this usage..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || parseFloat(quantity) > availableStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}