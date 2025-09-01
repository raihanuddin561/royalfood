/**
 * Simple SmartPriceInput Demo
 * 
 * This component demonstrates the simplified SmartPriceInput
 */

'use client'

import React, { useState } from 'react'
import SmartPriceInput from '@/components/ui/SmartPriceInput'

export default function SmartPriceInputDemo() {
  const [price1, setPrice1] = useState(0)
  const [price2, setPrice2] = useState(25.50)
  const [price3, setPrice3] = useState(0)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Simple Price Input Demo</h1>
        <p className="text-gray-600">Easy keyboard input for prices and amounts</p>
      </div>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Product Price</h2>
        <SmartPriceInput
          value={price1}
          onChange={setPrice1}
          label="Enter product price"
          placeholder="Type amount here..."
        />
        <p className="text-sm text-gray-600">
          Current value: <strong>BDT {price1.toFixed(2)}</strong>
        </p>
      </div>

      {/* With Existing Value */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Cost Price</h2>
        <SmartPriceInput
          value={price2}
          onChange={setPrice2}
          label="Enter cost price"
        />
        <p className="text-sm text-gray-600">
          Current value: <strong>BDT {price2.toFixed(2)}</strong>
        </p>
      </div>

      {/* With Min/Max */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Selling Price (Min: 1, Max: 10000)</h2>
        <SmartPriceInput
          value={price3}
          onChange={setPrice3}
          label="Enter selling price"
          min={1}
          max={10000}
        />
        <p className="text-sm text-gray-600">
          Current value: <strong>BDT {price3.toFixed(2)}</strong>
        </p>
      </div>

      {/* Results */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">Summary:</h3>
        <div className="text-green-700 text-sm space-y-1">
          <div>Product Price: <strong>BDT {price1.toFixed(2)}</strong></div>
          <div>Cost Price: <strong>BDT {price2.toFixed(2)}</strong></div>
          <div>Selling Price: <strong>BDT {price3.toFixed(2)}</strong></div>
          {price3 > price2 && price2 > 0 && (
            <div className="text-blue-700 font-medium mt-2">
              Profit: <strong>BDT {(price3 - price2).toFixed(2)}</strong> 
              ({(((price3 - price2) / price2) * 100).toFixed(1)}% margin)
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">✨ Key Features:</h3>
        <div className="text-blue-700 text-sm space-y-1">
          <div>• <strong>Direct keyboard input</strong> - Type values directly</div>
          <div>• <strong>Decimal support</strong> - Use . for decimal places</div>
          <div>• <strong>Auto-select</strong> - Focus selects all text for easy editing</div>
          <div>• <strong>Currency prefix</strong> - Shows BDT consistently</div>
          <div>• <strong>Validation</strong> - Min/max range checking</div>
          <div>• <strong>Real-time update</strong> - Values update as you type</div>
        </div>
      </div>
    </div>
  )
}
