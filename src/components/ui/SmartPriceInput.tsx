'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DollarSign } from 'lucide-react'
import { currentCurrency } from '@/lib/currency-config'

interface SmartPriceInputProps {
  value: number
  onChange: (value: number) => void
  currency?: string
  placeholder?: string
  className?: string
  min?: number
  max?: number
  label?: string
  autoFocus?: boolean
}

export function SmartPriceInput({ 
  value, 
  onChange, 
  currency = currentCurrency.code,
  placeholder = '0.00',
  className = '',
  min = 0,
  max,
  label,
  autoFocus = false
}: SmartPriceInputProps) {
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : '')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update input value when prop value changes, but only when not actively typing
  useEffect(() => {
    if (!isFocused && value !== parseFloat(inputValue)) {
      setInputValue(value > 0 ? value.toString() : '')
    }
  }, [value, isFocused, inputValue])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleInputChange = (newValue: string) => {
    // Allow decimal input patterns and keep the raw input visible
    const sanitizedValue = newValue.replace(/[^0-9.-]/g, '')
    setInputValue(sanitizedValue)
    
    // Only update parent when we have a valid number
    const numValue = parseFloat(sanitizedValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max || Infinity, numValue))
      onChange(clampedValue)
    } else if (sanitizedValue === '') {
      onChange(0)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Keep the input value as-is, don't auto-format
    const numValue = parseFloat(inputValue) || 0
    const clampedValue = Math.max(min, Math.min(max || Infinity, numValue))
    if (clampedValue !== numValue) {
      onChange(clampedValue)
      setInputValue(clampedValue > 0 ? clampedValue.toString() : '')
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    // Select all text for easy overwriting
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-sm ml-1 text-gray-500">
            {currency}
          </span>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            block w-full pl-16 pr-4 py-2.5 text-base
            border border-gray-300 rounded-lg shadow-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-colors bg-white
            ${className}
          `}
        />
      </div>
      
      {/* Validation feedback */}
      {value < min && inputValue !== '' && (
        <div className="mt-1 text-xs text-red-600">
          Minimum amount: {currency} {min.toFixed(2)}
        </div>
      )}
      
      {max && value > max && (
        <div className="mt-1 text-xs text-red-600">
          Maximum amount: {currency} {max.toFixed(2)}
        </div>
      )}
    </div>
  )
}

export default SmartPriceInput
