"use client"

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'

type Item = {
  id: string
  name: string
  sku: string
  unit: string
  currentStock: number
  reorderLevel: number
}

export default function StockOverview({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all')

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent
      if (ce?.detail?.filter) setFilter(ce.detail.filter)
      // scroll into view
      const el = document.getElementById('stock-overview')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    window.addEventListener('applyStockFilter', handler)
    return () => window.removeEventListener('applyStockFilter', handler)
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'in-stock') return items.filter(i => i.currentStock > i.reorderLevel)
    if (filter === 'low-stock') return items.filter(i => i.currentStock <= i.reorderLevel && i.currentStock > 0)
    return items.filter(i => i.currentStock === 0)
  }, [items, filter])

  function exportCsv() {
    const rows = filtered.map(i => ({ id: i.id, name: i.name, sku: i.sku, unit: i.unit, currentStock: i.currentStock, reorderLevel: i.reorderLevel }))
    const header = Object.keys(rows[0] || {}).join(',')
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-overview-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
  <div id="stock-overview" className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Stock Overview</h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">Filter:</div>
          <div className="flex space-x-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter==='all' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>All</button>
            <button onClick={() => setFilter('in-stock')} className={`px-3 py-1 rounded ${filter==='in-stock' ? 'bg-green-600 text-white' : 'bg-white border'}`}>In</button>
            <button onClick={() => setFilter('low-stock')} className={`px-3 py-1 rounded ${filter==='low-stock' ? 'bg-yellow-500 text-white' : 'bg-white border'}`}>Low</button>
            <button onClick={() => setFilter('out-of-stock')} className={`px-3 py-1 rounded ${filter==='out-of-stock' ? 'bg-red-600 text-white' : 'bg-white border'}`}>Out</button>
          </div>
          <button onClick={exportCsv} className="ml-3 inline-flex items-center px-3 py-1 bg-gray-100 rounded text-sm">Export CSV</button>
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items found</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Reorder</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => {
                  const stockStatus = item.currentStock === 0 ? 'out-of-stock' : item.currentStock <= item.reorderLevel ? 'low-stock' : 'in-stock'
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.currentStock} {item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.reorderLevel} {item.unit}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          stockStatus === 'out-of-stock' 
                            ? 'bg-red-100 text-red-800'
                            : stockStatus === 'low-stock'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {stockStatus === 'out-of-stock' ? 'Out' : stockStatus === 'low-stock' ? 'Low' : 'OK'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link href={`/inventory/edit/${item.id}`} className="text-blue-600 hover:underline text-sm">Details</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// (no module-level listeners here; component subscribes to events in useEffect)
