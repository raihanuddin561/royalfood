'use client'

import { useState, useEffect } from 'react'
import { X, Package, AlertTriangle, ChefHat } from 'lucide-react'
import { recordStockUsage } from '@/app/actions/restaurant-operations'
import { BaseModal, Button, Message } from '@/components/ui/Modal'
import { useNotification } from '@/components/ui/Notification'
import { SmartQuantityInput } from '@/components/ui/SmartQuantityInput'

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
  currentStock?: number
  unit: string
  costPrice?: number
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

  const today = new Date().toISOString().split('T')[0]
  const [usageDate, setUsageDate] = useState(today)

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { showNotification } = useNotification()

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
    if (selectedItem && Number(formData.quantity) > getAvailable(selectedItem)) {
      newErrors.quantity = `Insufficient stock. Available: ${getAvailable(selectedItem)} ${selectedItem.unit}`
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
  notes: formData.notes,
  usageDate: usageDate
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
        showNotification('error', result.error || 'Failed to record stock usage')
      }
    } catch (error) {
      console.error('Error recording stock usage:', error)
      showNotification('error', 'Failed to record stock usage')
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

  const getAvailable = (it: InventoryItem | undefined) => {
    if (!it) return 0
    // Use currentStock if available, otherwise fall back to quantity
    return it.currentStock ?? it.quantity ?? 0
  }

  const overQuantity = (() => {
    if (!selectedItem || !formData.quantity) return false
    const q = Number(formData.quantity)
    if (isNaN(q)) return false
    return q > getAvailable(selectedItem)
  })()

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Usage"
      description="Record an item-wise stock usage (recipe, wastage, other)"
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-0 space-y-4">
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
                  {item.name} - Available: {getAvailable(item)} {item.unit}
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
                    <span className="font-medium">Available Stock:</span> {getAvailable(selectedItem)} {selectedItem.unit}
                    {selectedItem.costPrice && (
                      <span className="ml-3">
                        <span className="font-medium">Cost:</span> BDT {selectedItem.costPrice.toFixed(2)}/{selectedItem.unit}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
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
            <div className="flex items-center space-x-2">
              <SmartQuantityInput
                value={parseFloat(formData.quantity) || 0}
                onChange={(value: number) => handleInputChange('quantity', value.toString())}
                unit={selectedItem?.unit || ''}
                placeholder={`Enter quantity${selectedItem ? ` in ${selectedItem.unit}` : ''}`}
                className={`rounded-md focus:ring-2 sm:text-sm ${errors.quantity || overQuantity ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => handleInputChange('quantity', String(getAvailable(selectedItem)))}
                  className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm border border-indigo-100"
                >
                  Use all
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Quantity Used is the physical amount to deduct from inventory (in the unit shown).
              Example: if you used 2.5 kg of Rice during food prep, enter "2.5" — the system will
              subtract 2.5 kg from Rice stock and record cost = cost-per-kg × 2.5.
            </p>
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
            {overQuantity && !errors.quantity && (
              <p className="mt-1 text-sm text-red-600">Entered quantity exceeds available stock. Available: {selectedItem ? getAvailable(selectedItem) : 0} {selectedItem?.unit}</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Date
            </label>
            <input
              type="date"
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Cost Preview */}
          {selectedItem && formData.quantity && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                    <span className="font-medium">Estimated Cost:</span> BDT {(Number(formData.quantity) * (selectedItem?.costPrice ?? 50)).toFixed(2)}
                    <br />
                    <span className="text-xs text-green-600">
                      {formData.quantity} {selectedItem.unit} × BDT {(selectedItem?.costPrice ?? 50).toFixed(2)}/{selectedItem.unit}
                    </span>
                  </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} disabled={loading || overQuantity}>
              {loading ? 'Recording...' : 'Record Usage'}
            </Button>
          </div>
        </form>
      </BaseModal>
  )
}
