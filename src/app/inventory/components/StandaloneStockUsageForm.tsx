'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/components/ui/Notification'
import { Package, AlertTriangle, ChefHat, Check, Plus, Trash } from 'lucide-react'
import { recordStockUsage, recordMultipleStockUsage } from '@/app/actions/restaurant-operations'

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
  const { showNotification } = useNotification()
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
  const [usageDate, setUsageDate] = useState(() => new Date().toISOString().slice(0, 10))
  // Mode: MENU = food item-wise (existing), ITEM = inventory item-wise (new)
  const [mode, setMode] = useState<'MENU' | 'ITEM'>('MENU')

  // For ITEM mode: dynamic list of ingredient entries
  const [entries, setEntries] = useState<Array<{ itemId: string; quantity: string }>>([
    { itemId: '', quantity: '' }
  ])

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

  const getAvailable = (it: InventoryItem | undefined) => {
    if (!it) return 0
    // some endpoints return `currentStock`, others `quantity` — prefer currentStock when present
    // @ts-ignore
    return typeof (it as any).currentStock === 'number' ? (it as any).currentStock : it.quantity ?? 0
  }

  // Over-quantity guards
  const menuOverQuantity = (() => {
    if (!selectedItem || !quantity) return false
    const q = parseFloat(quantity || '0')
    if (isNaN(q)) return false
    return q > getAvailable(selectedItem)
  })()

  const anyEntryOverQuantity = entries.some(en => {
    if (!en.itemId || !en.quantity) return false
    const it = items.find(i => i.id === en.itemId)
    if (!it) return false
    const q = parseFloat(en.quantity || '0')
    if (isNaN(q)) return false
    return q > getAvailable(it)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent submission when client-side over-quantity is detected
    if (menuOverQuantity || anyEntryOverQuantity) {
      showNotification('error', 'One or more entered quantities exceed available stock. Reduce quantities to proceed.')
      return
    }
      if (mode === 'MENU') {
      if (!selectedItemId || !quantity || isNaN(parseFloat(quantity))) {
        showNotification('error', 'Please select an item and enter a valid quantity')
        return
      }

      if (usageType === 'RECIPE' && !selectedMenuItemId) {
        showNotification('error', 'Please select a menu item for recipe usage')
        return
      }
      } else {
      // ITEM mode validations: at least one valid entry
      const validEntries = entries.filter(en => en.itemId && en.quantity && !isNaN(parseFloat(en.quantity)))
      if (validEntries.length === 0) {
        showNotification('error', 'Please add at least one inventory item with valid quantity')
        return
      }
    }

    setLoading(true)
    
    try {
      if (mode === 'MENU') {
        const result = await recordStockUsage({
          itemId: selectedItemId,
          quantity: parseFloat(quantity),
          usageType,
          menuItemId: usageType === 'RECIPE' ? selectedMenuItemId : undefined,
          description: description.trim() || undefined,
          usageDate: usageDate || undefined
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
          window.location.reload()
        } else {
          showNotification('error', result.error || 'Failed to record stock usage')
        }
      } else {
        // ITEM mode: call server-side batch recorder for atomic update
        try {
          const payload = {
            entries: entries
              .filter(en => en.itemId && en.quantity && !isNaN(parseFloat(en.quantity)))
              .map(en => ({ itemId: en.itemId, quantity: Number(en.quantity) })),
            usageType,
            description: description.trim() || undefined,
            usageDate: usageDate || undefined
          }

          const res = await recordMultipleStockUsage(payload)
            if (res.success) {
            setSuccess(true)
            setEntries([{ itemId: '', quantity: '' }])
            setDescription('')
            setTimeout(() => setSuccess(false), 3000)
            window.location.reload()
          } else {
            const msg = res.error || 'Failed to record batch stock usage'
            const details = res.details ? JSON.stringify(res.details) : ''
            showNotification('error', msg + (details ? '\n' + details : ''))
          }
        } catch (err) {
          console.error('Batch usage error:', err)
          showNotification('error', 'Failed to record batch stock usage')
        }
      }
    } catch (error) {
      console.error('Error recording stock usage:', error)
      showNotification('error', 'Failed to record stock usage')
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
      {/* Mode Toggle: MENU (existing) vs ITEM (inventory item-wise) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Entry Mode</label>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setMode('MENU')}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border transition-colors ${
              mode === 'MENU' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Menu-item wise
          </button>
          <button
            type="button"
            onClick={() => setMode('ITEM')}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border transition-colors ${
              mode === 'ITEM' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inventory-item wise
          </button>
        </div>
      </div>

      {/* Item Selection (MENU mode) or Entries (ITEM mode) */}
      {mode === 'MENU' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Item *</label>
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

          {/* Quantity Input (only for MENU mode) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Used *</label>
            <div className="flex space-x-2 items-center">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                step="0.01"
                min="0.01"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${menuOverQuantity ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
                required
              />
              {selectedItem && (
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                  {selectedItem.unit}
                </div>
              )}
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => setQuantity(String(selectedItem.quantity))}
                  className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm border border-indigo-100"
                >
                  Use all
                </button>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Quantity Used = physical amount to remove from inventory. The system will subtract this
              from the selected item's current stock and record cost (cost per unit × quantity).
            </p>

            {selectedItem && quantity && (
              <p className="mt-2 text-sm text-gray-600">
                Available: {getAvailable(selectedItem)} {selectedItem.unit} • 
                Estimated Cost: <span className="font-semibold">${estimatedCost.toFixed(2)}</span>
              </p>
            )}
            {menuOverQuantity && (
              <p className="mt-2 text-sm text-red-600">Entered quantity exceeds available stock. Reduce quantity or use "Use all".</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Entries *</label>
          <div className="space-y-3">
            {entries.map((en, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select
                    value={en.itemId}
                    onChange={(e) => setEntries(prev => prev.map((p, i) => i === idx ? { ...p, itemId: e.target.value } : p))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select item...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>
                    ))}
                  </select>
                  {/* Show available stock immediately when an item is selected */}
                  {en.itemId && (() => {
                    const it = items.find(i => i.id === en.itemId)
                    if (!it) return null
                    return (
                      <p className="mt-1 text-xs text-gray-600">Available: {it.currentStock} {it.unit}</p>
                    )
                  })()}
                </div>
                <div className="col-span-4">
                  {(() => {
                    const it = items.find(i => i.id === en.itemId)
                    const q = parseFloat(en.quantity || '0')
                    const over = it && !isNaN(q) && q > getAvailable(it)
                    return (
                      <>
                        <input
                          type="number"
                          value={en.quantity}
                          onChange={(e) => setEntries(prev => prev.map((p, i) => i === idx ? { ...p, quantity: e.target.value } : p))}
                          placeholder="Quantity"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-md ${over ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                        />
                        {/* Inline availability warning */}
                        {en.itemId && en.quantity && it && (
                          <p className={`mt-1 text-xs ${over ? 'text-red-600' : 'text-gray-600'}`}>
                            {over ? `Insufficient stock: available ${getAvailable(it)} ${it.unit}` : `Available: ${getAvailable(it)} ${it.unit}`}
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div className="col-span-2 flex space-x-2">
                  <button type="button" onClick={() => setEntries(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-2 bg-red-100 text-red-700 rounded-md">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={() => setEntries(prev => [...prev, { itemId: '', quantity: '' }])} className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-md">
                <Plus className="w-4 h-4 mr-2" /> Add entry
              </button>
            </div>
          </div>

          {/* Batch summary for ITEM mode */}
          <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-3">
            <p className="text-sm text-yellow-800 font-medium">Batch summary</p>
            <p className="text-sm text-gray-700 mt-2">
              In Inventory-item wise mode, enter a list of inventory items and their individual quantities above. The system will deduct
              each entry's quantity from that item's stock. The single "Quantity Used" field is hidden in this mode because quantities
              are provided per-entry.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Entries: <span className="font-semibold">{entries.length}</span> • Estimated Total Cost: <span className="font-semibold">${items && entries ? (entries.reduce((sum, en) => {
                const it = items.find(i => i.id === en.itemId)
                return sum + (it ? (parseFloat(en.quantity || '0') * it.costPrice) : 0)
              }, 0)).toFixed(2) : '0.00'}</span>
            </p>
          </div>
        </div>
      )}

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
          disabled={loading || menuOverQuantity || anyEntryOverQuantity}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recording...' : 'Record Stock Usage'}
        </button>
      </div>
    </form>
  )
}
