'use client'

import { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'

interface CustomUnitSelectorProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

const PREDEFINED_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'bag', label: 'Bag' },
  { value: 'dozen', label: 'Dozen (dz)' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'cm', label: 'Centimeter (cm)' }
]

export function CustomUnitSelector({ value, onChange, required, className = '' }: CustomUnitSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customUnit, setCustomUnit] = useState('')
  const [error, setError] = useState('')

  // Check if current value is a custom unit (not in predefined list)
  const isCustomUnit = value && !PREDEFINED_UNITS.some(unit => unit.value === value)

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true)
      setCustomUnit('')
      setError('')
    } else {
      setShowCustomInput(false)
      onChange(selectedValue)
    }
  }

  const handleCustomUnitSave = () => {
    const trimmedUnit = customUnit.trim()
    
    if (!trimmedUnit) {
      setError('Unit cannot be empty')
      return
    }

    if (trimmedUnit.length < 1 || trimmedUnit.length > 20) {
      setError('Unit must be between 1 and 20 characters')
      return
    }

    // Check if it's already in predefined units
    if (PREDEFINED_UNITS.some(unit => unit.value.toLowerCase() === trimmedUnit.toLowerCase())) {
      setError('This unit already exists in the predefined list')
      return
    }

    // Validate unit format (only alphanumeric and basic symbols)
    const validUnitPattern = /^[a-zA-Z0-9\-\.\(\)\/ ]+$/
    if (!validUnitPattern.test(trimmedUnit)) {
      setError('Unit can only contain letters, numbers, hyphens, dots, parentheses, slashes and spaces')
      return
    }

    onChange(trimmedUnit)
    setShowCustomInput(false)
    setError('')
  }

  const handleCustomUnitCancel = () => {
    setShowCustomInput(false)
    setCustomUnit('')
    setError('')
    if (!value) {
      onChange('')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {!showCustomInput ? (
        <select
          value={isCustomUnit ? 'custom' : value}
          onChange={(e) => handleSelectChange(e.target.value)}
          required={required}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        >
          <option value="">Select unit...</option>
          {PREDEFINED_UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
          <option value="custom" className="text-blue-600 font-medium">
            + Add Custom Unit
          </option>
          {isCustomUnit && (
            <option value="custom" className="text-green-600 font-medium">
              {value} (Custom Unit)
            </option>
          )}
        </select>
      ) : (
        <div className="border border-blue-300 rounded-lg p-3 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Add Custom Unit</span>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={customUnit}
              onChange={(e) => {
                setCustomUnit(e.target.value)
                setError('')
              }}
              placeholder="Enter custom unit (e.g., tray, carton, bundle)"
              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCustomUnitSave()
                } else if (e.key === 'Escape') {
                  handleCustomUnitCancel()
                }
              }}
              autoFocus
            />
            
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCustomUnitSave}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                type="button"
                onClick={handleCustomUnitCancel}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-gray-600">
              Tip: Press Enter to save, Escape to cancel
            </p>
          </div>
        </div>
      )}
      
      {isCustomUnit && !showCustomInput && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
          <Check className="w-3 h-3" />
          <span>Using custom unit: <strong>{value}</strong></span>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(true)
              setCustomUnit(value)
            }}
            className="text-blue-600 hover:text-blue-800 underline ml-2"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}
