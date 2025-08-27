"use client"

import React from 'react'

export default function StockShortcuts() {
  return (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => {
          const ev = new CustomEvent('applyStockFilter', { detail: { filter: 'low-stock' } })
          window.dispatchEvent(ev)
          const el = document.getElementById('stock-overview')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className="inline-flex items-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-lg text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200"
      >
        Low Stock
      </button>

      <button
        type="button"
        onClick={() => {
          const ev = new CustomEvent('applyStockFilter', { detail: { filter: 'out-of-stock' } })
          window.dispatchEvent(ev)
          const el = document.getElementById('stock-overview')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
      >
        Out of Stock
      </button>
    </div>
  )
}
