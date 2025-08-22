'use client'

import { useState, useEffect } from 'react'
import { X, Package, AlertTriangle, ChefHat } from 'lucide-react'
import { recordStockUsage } from '@/app/actions/restaurant-operations'

interface StockUsageFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  menuItemId?: string
  orderId?: string
}

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: {
    name: string
  }
}

export default function StockUsageForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  menuItemId, 
  orderId 
}: StockUsageFormProps) {
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    usageType: 'RECIPE' as 'RECIPE' | 'WASTAGE' | 'OTHER',
    notes: ''
  })

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadItems()
    }
  }, [isOpen])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/inventory/items')
      const data = await response.json()
      if (data.success) {
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.itemId) {
      newErrors.itemId = 'Please select an item'
    }
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required'
    }

    const selectedItem = items.find(item => item.id === formData.itemId)
    if (selectedItem && Number(formData.quantity) > selectedItem.quantity) {
      newErrors.quantity = `Insufficient stock. Available: ${selectedItem.quantity} ${selectedItem.unit}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const selectedItem = items.find(item => item.id === formData.itemId)
      if (!selectedItem) return

      const result = await recordStockUsage({
        itemId: formData.itemId,
        quantity: Number(formData.quantity),
        unit: selectedItem.unit,
        menuItemId: menuItemId,
        orderId: orderId,
        userId: 'system', // You'll need to get actual user ID
        usageType: formData.usageType,
        notes: formData.notes
      })

      if (result.success) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          itemId: '',
          quantity: '',
          usageType: 'RECIPE',
          notes: ''
        })
      } else {
        alert(result.error || 'Failed to record stock usage')
      }
    } catch (error) {
      console.error('Error recording stock usage:', error)
      alert('Failed to record stock usage')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  const selectedItem = items.find(item => item.id === formData.itemId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Record Stock Usage</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Usage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleInputChange('usageType', 'RECIPE')}
                className={`flex flex-col items-center p-3 rounded-md border ${
                  formData.usageType === 'RECIPE' 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <ChefHat className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Recipe</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('usageType', 'WASTAGE')}
                className={`flex flex-col items-center p-3 rounded-md border ${
                  formData.usageType === 'WASTAGE' 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Wastage</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('usageType', 'OTHER')}
                className={`flex flex-col items-center p-3 rounded-md border ${
                  formData.usageType === 'OTHER' 
                    ? 'bg-gray-100 border-gray-300 text-gray-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <Package className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Other</span>
              </button>
            </div>
          </div>

          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Item *
            </label>
            <select
              value={formData.itemId}
              onChange={(e) => handleInputChange('itemId', e.target.value)}
              className={`block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.itemId ? 'border-red-300' : ''
              }`}
            >
              <option value="">Choose an inventory item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - Available: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
            {errors.itemId && (
              <p className="mt-1 text-sm text-red-600">{errors.itemId}</p>
            )}
          </div>

          {/* Item Info */}
          {selectedItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <Package className="w-4 h-4 text-blue-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{selectedItem.name}</p>
                  <p className="text-sm text-blue-700">
                    Available: {selectedItem.quantity} {selectedItem.unit} | 
                    Category: {selectedItem.category.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Used * {selectedItem && `(${selectedItem.unit})`}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder={`Enter quantity${selectedItem ? ` in ${selectedItem.unit}` : ''}`}
              className={`block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.quantity ? 'border-red-300' : ''
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this usage"
              rows={3}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Cost Preview */}
          {selectedItem && formData.quantity && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">Estimated Cost:</span> ৳{(Number(formData.quantity) * 50).toFixed(2)}
                <br />
                <span className="text-xs text-green-600">
                  {formData.quantity} {selectedItem.unit} × ৳50/{selectedItem.unit}
                </span>
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
