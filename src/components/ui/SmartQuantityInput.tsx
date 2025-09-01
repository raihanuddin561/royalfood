'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'

interface SmartQuantityInputProps {
  value: number
  onChange: (value: number) => void
  unit: string
  min?: number
  max?: number
  placeholder?: string
  className?: string
  label?: string
  showConverter?: boolean
}

/**
 * Smart quantity input that handles:
 * - Fractional values (0.5, 0.25, 0.75, etc.)
 * - Common restaurant fractions (1/2, 1/4, 3/4)
 * - Unit conversions (g to kg, ml to L)
 * - Decimal precision up to 3 places for accuracy
 */
export function SmartQuantityInput({
  value,
  onChange,
  unit,
  min = 0,
  max,
  placeholder = "0.000",
  className = "",
  label,
  showConverter = true
}: SmartQuantityInputProps) {
  
  const [displayValue, setDisplayValue] = useState(value.toString())
  const [showQuickFractions, setShowQuickFractions] = useState(false)
  const [showUnitConverter, setShowUnitConverter] = useState(false)

  useEffect(() => {
    setDisplayValue(value.toString())
  }, [value])

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue)
    
    // Handle common fraction inputs
    const fractionMap: { [key: string]: number } = {
      '1/2': 0.5,
      '1/4': 0.25,
      '3/4': 0.75,
      '1/3': 0.333,
      '2/3': 0.667,
      '1/8': 0.125,
      '3/8': 0.375,
      '5/8': 0.625,
      '7/8': 0.875
    }
    
    if (fractionMap[inputValue]) {
      const newValue = fractionMap[inputValue]
      onChange(newValue)
      setDisplayValue(newValue.toString())
      return
    }
    
    // Handle decimal input
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue) && numValue >= min && (!max || numValue <= max)) {
      onChange(Number(numValue.toFixed(3))) // Precision to 3 decimal places
    } else if (inputValue === '' || inputValue === '.') {
      onChange(0)
    }
  }

  const quickFractions = [
    { label: '1/4', value: 0.25 },
    { label: '1/2', value: 0.5 },
    { label: '3/4', value: 0.75 },
    { label: '1', value: 1 },
    { label: '1.5', value: 1.5 },
    { label: '2', value: 2 },
    { label: '2.5', value: 2.5 },
    { label: '5', value: 5 }
  ]

  const unitConversions = getUnitConversions(unit)

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} ({unit})
        </label>
      )}
      
      <div className="relative">
        <input
          type="number"
          step="0.001"  // Allow up to 3 decimal places
          min={min}
          max={max}
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-gray-900 placeholder-gray-400
            ${className}
          `}
        />
        
        {showConverter && (
          <button
            type="button"
            onClick={() => setShowQuickFractions(!showQuickFractions)}
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
            title="Quick fractions"
          >
            <Calculator className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Fraction Buttons */}
      {showQuickFractions && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-600 mb-2">Quick fractions:</p>
          <div className="grid grid-cols-4 gap-2">
            {quickFractions.map((fraction) => (
              <button
                key={fraction.label}
                type="button"
                onClick={() => {
                  onChange(fraction.value)
                  setDisplayValue(fraction.value.toString())
                  setShowQuickFractions(false)
                }}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300"
              >
                {fraction.label} {unit}
              </button>
            ))}
          </div>
          
          {/* Unit Converter */}
          {unitConversions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Convert from:</p>
              <div className="space-y-2">
                {unitConversions.map((conversion) => (
                  <div key={conversion.fromUnit} className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder={`Enter ${conversion.fromUnit}`}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      onChange={(e) => {
                        const fromValue = parseFloat(e.target.value)
                        if (!isNaN(fromValue)) {
                          const converted = fromValue * conversion.multiplier
                          onChange(Number(converted.toFixed(3)))
                          setDisplayValue(converted.toFixed(3))
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {conversion.fromUnit} → {unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Value Display */}
      <div className="text-xs text-gray-500">
        Current: <span className="font-medium">{Number(value).toFixed(3)} {unit}</span>
        {value !== Math.floor(value) && (
          <span className="ml-2 text-blue-600">
            ({convertToFraction(value)} {unit})
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Get unit conversion options based on the base unit
 */
function getUnitConversions(unit: string): Array<{
  fromUnit: string
  multiplier: number
}> {
  const conversions: { [key: string]: Array<{ fromUnit: string; multiplier: number }> } = {
    'kg': [
      { fromUnit: 'g', multiplier: 0.001 },
      { fromUnit: 'lb', multiplier: 0.453592 },
      { fromUnit: 'oz', multiplier: 0.0283495 }
    ],
    'L': [
      { fromUnit: 'ml', multiplier: 0.001 },
      { fromUnit: 'fl oz', multiplier: 0.0295735 },
      { fromUnit: 'cup', multiplier: 0.236588 },
      { fromUnit: 'pint', multiplier: 0.473176 }
    ],
    'pcs': [
      { fromUnit: 'dozen', multiplier: 12 },
      { fromUnit: 'pack', multiplier: 1 }
    ]
  }

  return conversions[unit] || []
}

/**
 * Convert decimal to nearest common fraction for display
 */
function convertToFraction(decimal: number): string {
  const commonFractions = [
    { decimal: 0.125, fraction: '1/8' },
    { decimal: 0.25, fraction: '1/4' },
    { decimal: 0.333, fraction: '1/3' },
    { decimal: 0.375, fraction: '3/8' },
    { decimal: 0.5, fraction: '1/2' },
    { decimal: 0.625, fraction: '5/8' },
    { decimal: 0.667, fraction: '2/3' },
    { decimal: 0.75, fraction: '3/4' },
    { decimal: 0.875, fraction: '7/8' }
  ]

  const fractionalPart = decimal - Math.floor(decimal)
  const closest = commonFractions.find(f => Math.abs(f.decimal - fractionalPart) < 0.01)
  
  if (closest) {
    const wholePart = Math.floor(decimal)
    return wholePart > 0 ? `${wholePart} ${closest.fraction}` : closest.fraction
  }
  
  return decimal.toFixed(3)
}

/**
 * Precision-safe math operations for quantities
 */
export const QuantityMath = {
  add: (a: number, b: number): number => {
    return Number((a + b).toFixed(3))
  },
  
  subtract: (a: number, b: number): number => {
    return Number((a - b).toFixed(3))
  },
  
  multiply: (a: number, b: number): number => {
    return Number((a * b).toFixed(3))
  },
  
  divide: (a: number, b: number): number => {
    if (b === 0) return 0
    return Number((a / b).toFixed(3))
  },
  
  isEqual: (a: number, b: number, tolerance: number = 0.001): boolean => {
    return Math.abs(a - b) < tolerance
  },
  
  format: (value: number, decimals: number = 3): string => {
    return Number(value).toFixed(decimals)
  }
}
