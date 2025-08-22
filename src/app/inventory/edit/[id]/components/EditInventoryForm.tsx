'use client'

import { useState } from 'react'
import { Save, X, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateInventoryItem, toggleItemStatus } from '@/app/actions/inventory'
import { CustomUnitSelector } from '../../../components/CustomUnitSelector'

interface EditInventoryFormProps {
  item: {
    id: string
    name: string
    sku: string
    description: string | null
    unit: string
    costPrice: number | null
    minStockLevel: number | null
    currentStock: number
    isActive: boolean
    categoryId: string
    supplierId: string | null
    expiryDate: Date | null
    location: string | null
    barcode: string | null
  }
  categories: Array<{ id: string; name: string }>
  suppliers: Array<{ id: string; name: string }>
}

export function EditInventoryForm({ item, categories, suppliers }: EditInventoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: item.name,
    sku: item.sku,
    description: item.description || '',
    unit: item.unit,
    costPrice: item.costPrice?.toString() || '',
    minStockLevel: item.minStockLevel?.toString() || '',
    currentStock: item.currentStock.toString(),
    categoryId: item.categoryId,
    supplierId: item.supplierId || '',
    expiryDate: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : '',
    location: item.location || '',
    barcode: item.barcode || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateInventoryItem(item.id, {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        unit: formData.unit,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : null,
        currentStock: parseInt(formData.currentStock),
        categoryId: formData.categoryId,
        supplierId: formData.supplierId || null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        location: formData.location || null,
        barcode: formData.barcode || null,
      })

      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => {
          router.push('/inventory')
        }, 1500)
      } else {
        setError(result.message || 'Failed to update item')
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('An unexpected error occurred while updating the item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await toggleItemStatus(item.id)
      if (result.success) {
        setSuccess(result.message)
        // Refresh the page to show updated status
        router.refresh()
      } else {
        setError(result.message || 'Failed to toggle item status')
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">Item Status</h3>
          <p className="text-sm text-gray-600">
            {item.isActive ? 'Item is currently active and available for use' : 'Item is currently inactive and hidden'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {isTogglingStatus ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : item.isActive ? (
            <ToggleRight className="w-5 h-5 text-green-600" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm">
            {item.isActive ? 'Deactivate' : 'Activate'}
          </span>
        </button>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter SKU"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter item description"
          />
        </div>

        {/* Category and Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unit and Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit *
            </label>
            <CustomUnitSelector
              value={formData.unit}
              onChange={(newUnit) => setFormData(prev => ({ ...prev, unit: newUnit }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Stock *
            </label>
            <input
              type="number"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Stock Level
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleInputChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (BDT) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">Cost per unit of this ingredient/stock item</p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Storage location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Barcode number"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => router.push('/inventory')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Updating...' : 'Update Item'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
