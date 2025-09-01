'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Plus, Minus } from 'lucide-react'

interface SmartPriceInputProps {
  value: number
  onChange: (value: number) => void
  currency?: string
  placeholder?: string
  className?: string
  min?: number
  max?: number
}

export function SmartPriceInput({ 
  value, 
  onChange, 
  currency = '₹',
  placeholder = '0.00',
  className = '',
  min = 0,
  max
}: SmartPriceInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [showFractions, setShowFractions] = useState(false)

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    const numValue = parseFloat(newValue) || 0
    if (!isNaN(numValue) && numValue >= min && (!max || numValue <= max)) {
      onChange(numValue)
    }
  }

  const handleBlur = () => {
    const numValue = parseFloat(inputValue) || 0
    const formattedValue = numValue.toFixed(2)
    setInputValue(formattedValue)
    onChange(numValue)
  }

  const addAmount = (amount: number) => {
    const newValue = Math.max(min, (value || 0) + amount)
    if (!max || newValue <= max) {
      onChange(newValue)
    }
  }

  const addFraction = (fraction: number) => {
    const newValue = Math.max(min, (value || 0) + fraction)
    if (!max || newValue <= max) {
      onChange(newValue)
    }
  }

  const commonAmounts = [1, 5, 10, 25, 50, 100]
  const fractions = [
    { label: '+0.25', value: 0.25 },
    { label: '+0.50', value: 0.5 },
    { label: '+0.75', value: 0.75 }
  ]

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 text-sm">{currency}</span>
        </div>
        <input
          type="number"
          step="0.01"
          min={min}
          max={max}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`block w-full pl-12 pr-20 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        />
        
        {/* Quick Amount Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <button
            type="button"
            onClick={() => addAmount(-1)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            disabled={value <= min}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => addAmount(1)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors ml-1"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowFractions(!showFractions)}
            className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            ±
          </button>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="mt-2 flex flex-wrap gap-1">
        {commonAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addAmount(amount)}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            +{currency}{amount}
          </button>
        ))}
      </div>

      {/* Fraction Buttons */}
      {showFractions && (
        <div className="mt-2 flex flex-wrap gap-1">
          {fractions.map((frac) => (
            <button
              key={frac.value}
              type="button"
              onClick={() => addFraction(frac.value)}
              className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              {frac.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(Math.floor(value || 0))}
            className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Round Down
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.ceil(value || 0))}
            className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Round Up
          </button>
        </div>
      )}
      
      {/* Current Value Display */}
      {value > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          Current: {currency}{value.toFixed(2)}
          {value !== Math.floor(value) && (
            <span className="ml-2 text-blue-600">
              ≈ {value < 1 ? 
                  value === 0.25 ? '1/4' : 
                  value === 0.5 ? '1/2' : 
                  value === 0.75 ? '3/4' : 
                  value.toFixed(3) 
                : 
                `${Math.floor(value)} ${((value % 1) === 0.25 ? '1/4' : (value % 1) === 0.5 ? '1/2' : (value % 1) === 0.75 ? '3/4' : (value % 1).toFixed(2))}`
              }
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartPriceInput
