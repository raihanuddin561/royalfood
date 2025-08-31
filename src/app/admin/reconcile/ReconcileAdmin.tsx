"use client"

import React, { useEffect, useState } from 'react'
import { useNotification } from '@/components/ui/Notification'

type Diff = {
  id: string
  name: string
  currentStock: number
  computedStock: number
  diff: number
}

export default function ReconcileAdmin() {
  const { showNotification } = useNotification()
  const [diffs, setDiffs] = useState<Diff[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reconcile-stock')
      const data = await res.json()
      if (data.success) setDiffs(data.diffs || [])
      else setDiffs([])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function applyItems(itemIds: string[]) {
    setApplying('bulk')
    try {
      const res = await fetch('/api/admin/reconcile-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      })
      const data = await res.json()
      if (data.success) {
        await load()
      } else {
        showNotification('error', 'Apply failed: ' + (data.error || 'unknown'))
      }
    } catch (e) {
      console.error(e)
      showNotification('error', 'Apply request failed')
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Stock Reconciliation</h2>
        <div className="flex items-center space-x-2">
          <button onClick={load} className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
          <button onClick={() => applyItems(diffs.map(d => d.id))} disabled={diffs.length===0 || applying!==null} className="px-3 py-1 bg-blue-600 text-white rounded">
            {applying === 'bulk' ? 'Applying...' : `Apply All (${diffs.length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : diffs.length === 0 ? (
        <p className="text-gray-500">No mismatches found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Current</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Computed</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Diff</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diffs.map(d => (
                <tr key={d.id}>
                  <td className="px-3 py-2 text-sm text-gray-900">{d.name}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-700">{d.currentStock}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-700">{d.computedStock}</td>
                  <td className={`px-3 py-2 text-sm text-right ${d.diff>0 ? 'text-red-600' : 'text-green-600'}`}>{d.diff}</td>
                  <td className="px-3 py-2 text-right">
                    <button disabled={applying!==null} onClick={() => applyItems([d.id])} className="px-2 py-1 bg-emerald-600 text-white rounded text-sm">
                      {applying === d.id ? 'Applying...' : 'Apply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
