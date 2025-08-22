'use client'

import { useState, useEffect } from 'react'
import { Package, AlertTriangle, ChefHat, Check } from 'lucide-react'
import { recordStockUsage } from '@/app/actions/restaurant-operations'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  costPrice: number
  category: {
    name: string
  }
}

interface MenuItem {
  id: string
  name: string
}

export default function StandaloneStockUsageForm() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [usageType, setUsageType] = useState<'RECIPE' | 'WASTAGE' | 'OTHER'>('RECIPE')
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('')
  const [description, setDescription] = useState('')

  // Fetch inventory items and menu items
  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsResponse, menuResponse] = await Promise.all([
          fetch('/api/inventory/items'),
          fetch('/api/menu-items')
        ])
        
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setItems(itemsData)
        }
        
        if (menuResponse.ok) {
          const menuData = await menuResponse.json()
          setMenuItems(menuData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    fetchData()
  }, [])

  const selectedItem = items.find(item => item.id === selectedItemId)
  const estimatedCost = selectedItem && quantity ? 
    parseFloat(quantity) * selectedItem.costPrice : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItemId || !quantity || isNaN(parseFloat(quantity))) {
      alert('Please select an item and enter a valid quantity')
      return
    }

    if (usageType === 'RECIPE' && !selectedMenuItemId) {
      alert('Please select a menu item for recipe usage')
      return
    }

    setLoading(true)
    
    try {
      const result = await recordStockUsage({
        itemId: selectedItemId,
        quantity: parseFloat(quantity),
        usageType,
        menuItemId: usageType === 'RECIPE' ? selectedMenuItemId : undefined,
        description: description.trim() || undefined
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setSelectedItemId('')
        setQuantity('')
        setUsageType('RECIPE')
        setSelectedMenuItemId('')
        setDescription('')
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
        
        // Refresh page to show updated data
        window.location.reload()
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

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Stock Usage Recorded!</h3>
        <p className="text-green-600">The usage has been successfully recorded and inventory updated.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Usage Type Selection */}
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

      {/* Item Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Item *
        </label>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Choose an item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.quantity} {item.unit} available - ${item.costPrice.toFixed(2)}/{item.unit})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity Used *
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            step="0.01"
            min="0.01"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {selectedItem && (
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
              {selectedItem.unit}
            </div>
          )}
        </div>
        {selectedItem && quantity && (
          <p className="mt-2 text-sm text-gray-600">
            Available: {selectedItem.quantity} {selectedItem.unit} • 
            Estimated Cost: <span className="font-semibold">${estimatedCost.toFixed(2)}</span>
          </p>
        )}
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
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this usage..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recording...' : 'Record Stock Usage'}
        </button>
      </div>
    </form>
  )
}
