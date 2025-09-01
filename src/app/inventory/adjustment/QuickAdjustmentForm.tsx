'use client'

import React, { useState } from 'react'
import { Plus, Minus, Save, TrendingUp, TrendingDown } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'
import { SmartQuantityInput } from '@/components/ui/SmartQuantityInput'

export default function QuickAdjustmentForm({ items, onSuccess }: { items: any[]; onSuccess?: () => void }) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE' | 'WASTE'>('INCREASE')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)

  const selectedItem = items.find(i => i.id === selectedItemId)
  const getAvailable = (it: any) => it ? (typeof it.currentStock === 'number' ? it.currentStock : it.quantity ?? 0) : 0

  const wouldBeNegative = (() => {
    if (!selectedItem) return false
    if (!quantity || quantity <= 0) return false
    // For DECREASE or WASTE, we're removing stock
    const isDecrease = adjustmentType === 'DECREASE' || adjustmentType === 'WASTE'
    return isDecrease && quantity > getAvailable(selectedItem)
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return showNotification('error', 'Please select an item')
    if (!quantity || quantity <= 0) return showNotification('error', 'Enter a valid quantity')
    if (wouldBeNegative) return showNotification('error', 'Entered quantity would reduce stock below zero')

    setLoading(true)
    try {
      // Determine the actual quantity change based on type
      let actualQuantity = quantity
      let adjustmentTypeForAPI = 'ADJUSTMENT'
      
      if (adjustmentType === 'DECREASE' || adjustmentType === 'WASTE') {
        actualQuantity = -quantity // Negative for decreases
        if (adjustmentType === 'WASTE') {
          adjustmentTypeForAPI = 'WASTE'
        }
      }

      const payload = { 
        itemId: selectedItemId, 
        quantity: actualQuantity, 
        type: adjustmentTypeForAPI,
        reason: reason || `${adjustmentType}: ${quantity} ${selectedItem?.unit || 'units'}`
      }
      
      const res = await fetch('/api/inventory/adjust', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Adjustment recorded successfully')
        setSelectedItemId('')
        setQuantity(0)
        setReason('')
        if (onSuccess) onSuccess()
      } else {
        showNotification('error', data?.message || 'Failed to record adjustment')
      }
    } catch (err) {
      console.error('Adjustment error:', err)
      showNotification('error', 'Failed to record adjustment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
        <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white">
          <option value="">Choose an item...</option>
          {items.map(it => <option key={it.id} value={it.id}>{it.name} - Current: {getAvailable(it)} {it.unit}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType('INCREASE')}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                adjustmentType === 'INCREASE'
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Increase Stock
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('DECREASE')}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                adjustmentType === 'DECREASE'
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-1" />
              Decrease Stock
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('WASTE')}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                adjustmentType === 'WASTE'
                  ? 'bg-red-100 border-red-300 text-red-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Minus className="w-4 h-4 inline mr-1" />
              Record Waste
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {adjustmentType === 'INCREASE' && 'Add stock (e.g., found extra inventory, received unrecorded items)'}
            {adjustmentType === 'DECREASE' && 'Remove stock (e.g., stock count correction, damaged items)'}
            {adjustmentType === 'WASTE' && 'Record waste/spoilage (will decrease stock and track waste)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity {selectedItem && `(${selectedItem.unit})`}</label>
          <SmartQuantityInput
            value={quantity}
            onChange={(value: number) => setQuantity(value)}
            unit={selectedItem?.unit || ''}
            placeholder="0.00"
            className={`rounded-lg ${wouldBeNegative ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 placeholder-gray-400 bg-white`}
          />
          {selectedItem && (
            <p className={`mt-1 text-xs ${wouldBeNegative ? 'text-red-600' : 'text-gray-600'}`}>
              {wouldBeNegative 
                ? `This would reduce stock below zero. Available: ${getAvailable(selectedItem)} ${selectedItem.unit}` 
                : `Available: ${getAvailable(selectedItem)} ${selectedItem.unit} | ${
                    adjustmentType === 'INCREASE' 
                      ? `Will become: ${(getAvailable(selectedItem) + quantity).toFixed(3)} ${selectedItem.unit}`
                      : `Will become: ${Math.max(0, getAvailable(selectedItem) - quantity).toFixed(3)} ${selectedItem.unit}`
                  }`
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Enter reason for ${adjustmentType.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button type="submit" disabled={loading || wouldBeNegative} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save Adjustment'}
        </button>
        <button type="button" onClick={() => { setSelectedItemId(''); setQuantity(0); setReason('') }} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
          Clear
        </button>
      </div>
    </form>
  )
}
