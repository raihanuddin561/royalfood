'use client'

import { useState } from 'react'
import { Plus, Ruler, Save, X } from 'lucide-react'
import { useNotification, Notification } from '@/components/ui/Notification'

interface Unit {
  id: string
  name: string
  shortName: string
  description: string | null
  isActive: boolean
}

interface UnitsManagerProps {
  units: Unit[]
  onUnitAdded: (unit: Unit) => void
}

export function UnitsManager({ units: initialUnits, onUnitAdded }: UnitsManagerProps) {
  const [units, setUnits] = useState(initialUnits)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showNotification, notification, clearNotification } = useNotification()

  const handleAddUnit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const newUnit = await response.json()
        setUnits([...units, newUnit])
        onUnitAdded(newUnit)
        setShowAddForm(false)
        showNotification('success', `Unit "${newUnit.name}" created successfully!`)
      } else {
        const error = await response.json()
        showNotification('error', error.message || 'Failed to create unit', 'Error Creating Unit')
      }
    } catch (error) {
      showNotification('error', 'Failed to create unit. Please check your connection and try again.', 'Connection Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Ruler className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Units Manager</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showAddForm ? 'Cancel' : 'Add Unit'}
        </button>
      </div>

      {/* Add Unit Form */}
      {showAddForm && (
        <form action={handleAddUnit} className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g., Kilograms, Dozen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name <span className="text-red-500">*</span>
              </label>
              <input
                name="shortName"
                type="text"
                required
                placeholder="e.g., kg, dz"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                name="description"
                type="text"
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSubmitting ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      )}

      {/* Units List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
          >
            <div>
              <div className="font-medium text-gray-900 text-sm">{unit.name}</div>
              <div className="text-xs text-gray-500">
                {unit.shortName} {unit.description && `• ${unit.description}`}
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${unit.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
        ))}
      </div>
      
      {units.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No units available. Add your first unit above.</p>
        </div>
      )}
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
