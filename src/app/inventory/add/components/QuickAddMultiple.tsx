'use client'

import { useState } from 'react'
import { Plus, X, Save, AlertTriangle, Check, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createMultipleInventoryItems } from '@/app/actions/inventory'

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
}

interface QuickAddItem {
  id: string
  name: string
  categoryId: string
  supplierId: string
  unit: string
  costPrice: string
  currentStock: string
  reorderLevel: string
  description: string
}

interface QuickAddMultipleProps {
  categories: Category[]
  suppliers: Supplier[]
}

const UNIT_SUGGESTIONS = [
  'kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack', 'bottle', 'can', 'bag', 
  'dozen', 'roll', 'sheet', 'meter', 'cm', 'tray', 'carton', 'bundle'
]

export function QuickAddMultiple({ categories, suppliers }: QuickAddMultipleProps) {
  const router = useRouter()
  const [items, setItems] = useState<QuickAddItem[]>([
    {
      id: '1',
      name: '',
      categoryId: '',
      supplierId: '',
      unit: '',
      costPrice: '',
      currentStock: '',
      reorderLevel: '',
      description: ''
    }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addRow = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id))) + 1).toString()
    setItems([...items, {
      id: newId,
      name: '',
      categoryId: '',
      supplierId: '',
      unit: '',
      costPrice: '',
      currentStock: '',
      reorderLevel: '',
      description: ''
    }])
  }

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuickAddItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setError(null)
    setSuccess(null)
  }

  const clearAll = () => {
    setItems([{
      id: '1',
      name: '',
      categoryId: '',
      supplierId: '',
      unit: '',
      costPrice: '',
      currentStock: '',
      reorderLevel: '',
      description: ''
    }])
    setError(null)
    setSuccess(null)
  }

  const validateItems = () => {
    const errors = []
    const names = new Set()
    
    for (const item of items) {
      const rowNum = items.indexOf(item) + 1
      
      // Check required fields
      if (!item.name.trim()) {
        errors.push(`Row ${rowNum}: Item name is required`)
      }
      if (!item.categoryId) {
        errors.push(`Row ${rowNum}: Category is required`)
      }
      if (!item.unit.trim()) {
        errors.push(`Row ${rowNum}: Unit is required`)
      }
      if (!item.costPrice || parseFloat(item.costPrice) <= 0) {
        errors.push(`Row ${rowNum}: Cost price must be greater than 0`)
      }
      if (!item.currentStock || parseFloat(item.currentStock) < 0) {
        errors.push(`Row ${rowNum}: Current stock must be 0 or greater`)
      }
      if (!item.reorderLevel || parseFloat(item.reorderLevel) < 0) {
        errors.push(`Row ${rowNum}: Reorder level must be 0 or greater`)
      }
      
      // Check for duplicate names
      if (item.name.trim()) {
        const normalizedName = item.name.trim().toLowerCase()
        if (names.has(normalizedName)) {
          errors.push(`Row ${rowNum}: Duplicate item name "${item.name.trim()}"`)
        } else {
          names.add(normalizedName)
        }
      }
    }
    
    return errors
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate all items
      const validationErrors = validateItems()
      if (validationErrors.length > 0) {
        setError(validationErrors.join('; '))
        return
      }

      // Filter out empty rows
      const validItems = items.filter(item => item.name.trim())
      
      if (validItems.length === 0) {
        setError('Please add at least one item with a name')
        return
      }

      // Convert to FormData format expected by server action
      const itemsData = validItems.map(item => ({
        name: item.name.trim(),
        categoryId: item.categoryId,
        supplierId: item.supplierId || null,
        unit: item.unit.trim(),
        costPrice: parseFloat(item.costPrice),
        currentStock: parseFloat(item.currentStock),
        reorderLevel: parseFloat(item.reorderLevel),
        description: item.description.trim() || null
      }))

      const result = await createMultipleInventoryItems(itemsData)
      
      if (result.success) {
        setSuccess(`Successfully created ${validItems.length} items!`)
        setTimeout(() => {
          router.push('/inventory')
        }, 2000)
      } else {
        setError(result.message || 'Failed to create items')
      }
    } catch (error) {
      console.error('Quick add error:', error)
      setError('An unexpected error occurred while creating items')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Plus className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Add Multiple Items</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{items.length} rows</span>
            <button
              onClick={addRow}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Add Row
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">Add multiple items at once using the table below</p>
      </div>
      
      <div className="p-6">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                <div className="text-sm text-red-700 mt-1">
                  {error.split('; ').map((err, index) => (
                    <div key={index}>• {err}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-sm text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Item Name *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Category *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Unit *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Cost Price *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Stock *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Reorder *
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Supplier
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Enter item name..."
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateItem(item.id, 'categoryId', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">Select...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="kg, pcs, box..."
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                      list={`unit-suggestions-${item.id}`}
                    />
                    <datalist id={`unit-suggestions-${item.id}`}>
                      {UNIT_SUGGESTIONS.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.costPrice}
                      onChange={(e) => updateItem(item.id, 'costPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.currentStock}
                      onChange={(e) => updateItem(item.id, 'currentStock', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.reorderLevel}
                      onChange={(e) => updateItem(item.id, 'reorderLevel', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={item.supplierId}
                      onChange={(e) => updateItem(item.id, 'supplierId', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">Optional...</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      onClick={() => removeRow(item.id)}
                      disabled={items.length === 1}
                      className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      title={items.length === 1 ? "Cannot remove the last row" : "Remove this row"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Items...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create All Items ({items.filter(item => item.name.trim()).length})
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>• Fields marked with * are required</p>
          <p>• Item names must be unique</p>
          <p>• Use the unit suggestions or enter custom units</p>
          <p>• Empty rows will be ignored</p>
        </div>
      </div>
    </div>
  )
}
