"use client"

import React, { useEffect, useState } from 'react'

type Item = {
  id: string
  name: string
  sku: string
  currentStock: number
  reorderLevel: number
  supplier?: { id: string; name: string }
}

export default function LowStockPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/low-stock')
      const data = await res.json()
      if (data.success) setItems(data.items || [])
      else setItems([])
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createDrafts() {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/low-stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.success) {
        showNotification('success', `Created ${data.created.length} purchase drafts. Skipped ${data.skipped.length} items without supplier.`)
        load()
      } else {
        showNotification('error', 'Failed: ' + (data.error || 'unknown'))
      }
    } catch (e) {
      console.error(e)
      showNotification('error', 'Create request failed')
    } finally { setCreating(false) }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Low Stock Items</h3>
        <div className="flex items-center space-x-2">
          <button onClick={load} className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
          <button onClick={createDrafts} disabled={creating || items.length===0} className="px-3 py-1 bg-blue-600 text-white rounded">
            {creating ? 'Creating...' : 'Create Purchase Drafts'}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No low-stock items found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Reorder</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Supplier</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(it => (
                <tr key={it.id}>
                  <td className="px-3 py-2 text-sm text-gray-900">{it.name}</td>
                  <td className="px-3 py-2 text-right text-sm text-gray-700">{it.currentStock}</td>
                  <td className="px-3 py-2 text-right text-sm text-gray-700">{it.reorderLevel}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{it.supplier?.name || 'No supplier'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
