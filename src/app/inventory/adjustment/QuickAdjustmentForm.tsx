'use client'

import React, { useState } from 'react'
import { Plus, Minus, Save } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

export default function QuickAdjustmentForm({ items }: { items: any[] }) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'ADJUSTMENT' | 'WASTE'>('ADJUSTMENT')
  const [quantity, setQuantity] = useState('')
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)

  const selectedItem = items.find(i => i.id === selectedItemId)
  const getAvailable = (it: any) => it ? (typeof it.currentStock === 'number' ? it.currentStock : it.quantity ?? 0) : 0

  const wouldBeNegative = (() => {
    if (!selectedItem) return false
    if (!quantity) return false
    const q = parseFloat(quantity)
    if (isNaN(q)) return false
    // For WASTE or ADJUSTMENT with negative sign, we consider removal
    // User may use positive number to indicate amount to remove for WASTE
    // We assume adjustments that decrease stock are recorded as positive numbers but type= WASTE
    return q > getAvailable(selectedItem)
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return showNotification('error', 'Please select an item')
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return showNotification('error', 'Enter a valid quantity')
    if (wouldBeNegative) return showNotification('error', 'Entered quantity would reduce stock below zero')

    setLoading(true)
    try {
      // call server action to create inventory log / adjust stock
      // using fetch to server route: POST /api/inventory/adjust
      const payload = { itemId: selectedItemId, quantity: Number(quantity), type: adjustmentType }
      const res = await fetch('/api/inventory/adjust', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification('success', 'Adjustment recorded')
        setSelectedItemId('')
        setQuantity('')
      } else {
        showNotification('error', data?.message || 'Failed to record adjustment')
      }
    } catch (err) {
      console.error(err)
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
          <select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white">
            <option value="ADJUSTMENT">Stock Adjustment</option>
            <option value="WASTE">Record Waste</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="relative">
            <input type="number" step="0.01" placeholder="0.00" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`w-full px-4 py-2 rounded-lg ${wouldBeNegative ? 'border-red-500 focus:ring-red-200' : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 placeholder-gray-400 bg-white`} />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <button type="button" onClick={() => {
                setQuantity(prev => {
                  const n = parseFloat(prev || '0')
                  const next = Math.max(0, n - 1)
                  return next.toFixed(2)
                })
              }} className="w-6 h-6 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
              <button type="button" onClick={() => {
                setQuantity(prev => {
                  const n = parseFloat(prev || '0')
                  const next = n + 1
                  return next.toFixed(2)
                })
              }} className="w-6 h-6 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          {selectedItem && (
            <p className={`mt-1 text-xs ${wouldBeNegative ? 'text-red-600' : 'text-gray-600'}`}>{wouldBeNegative ? `This would reduce stock below zero. Available: ${getAvailable(selectedItem)} ${selectedItem.unit}` : `Available: ${getAvailable(selectedItem)} ${selectedItem.unit}`}</p>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button type="submit" disabled={loading || wouldBeNegative} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save Adjustment'}
        </button>
        <button type="button" onClick={() => { setSelectedItemId(''); setQuantity('') }} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
          Clear
        </button>
      </div>
    </form>
  )
}
