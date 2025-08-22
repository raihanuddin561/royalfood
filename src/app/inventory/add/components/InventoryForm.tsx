'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createInventoryItem } from '@/app/actions/inventory'
import { CustomUnitSelector } from '../../components/CustomUnitSelector'
import { useNotification, Notification } from '@/components/ui/Notification'

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
}

interface InventoryFormProps {
  categories: Category[]
  suppliers: Supplier[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200"
    >
      <Save className="w-5 h-5 mr-2" />
      {pending ? 'Creating Item...' : 'Create Inventory Item'}
    </button>
  )
}

export default function InventoryForm({ categories, suppliers }: InventoryFormProps) {
  const [selectedUnit, setSelectedUnit] = useState('')
  const { showNotification, notification, clearNotification } = useNotification()
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    // Add the selected unit to form data
    if (selectedUnit) {
      formData.set('unit', selectedUnit)
    }
    
    const result = await createInventoryItem(formData)
    
    if (result.success) {
      showNotification('success', 'Item created successfully! Redirecting to inventory page...', 'Success')
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/inventory')
      }, 2000)
    } else {
      showNotification('error', result.message, 'Error Creating Item')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g., Chicken, Rice, Tomatoes"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit <span className="text-red-500">*</span>
            </label>
            <CustomUnitSelector
              value={selectedUnit}
              onChange={setSelectedUnit}
              required
            />
            {/* Hidden input for form submission */}
            <input type="hidden" name="unit" value={selectedUnit} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              name="supplierId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select supplier (optional)...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price <span className="text-red-500">*</span>
            </label>
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Stock <span className="text-red-500">*</span>
            </label>
            <input
              name="initialStock"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Level <span className="text-red-500">*</span>
            </label>
            <input
              name="reorderLevel"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              name="sku"
              type="text"
              placeholder="Auto-generated if empty"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Item description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white resize-vertical"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  name="brand"
                  type="text"
                  placeholder="e.g., Tilda, Uncle Ben's"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade/Quality
                </label>
                <input
                  name="grade"
                  type="text"
                  placeholder="e.g., Grade A, Premium"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specification
              </label>
              <input
                name="specification"
                type="text"
                placeholder="e.g., Ribeye Cut, Basmati Premium"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pack Size
              </label>
              <input
                name="packSize"
                type="text"
                placeholder="e.g., 25kg bag, 1kg pack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <SubmitButton />
        </div>
      </form>
    </div>

    {/* Notification */}
    {notification && (
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={clearNotification}
      />
    )}
  </>
  )
}
