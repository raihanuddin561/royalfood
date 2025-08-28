import React from 'react'
import Link from 'next/link'
import LowStockPanel from './LowStockPanel'

export default function LowStockPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Low Stock</h1>
          <Link href="/inventory" className="text-sm text-blue-600">Back to Inventory</Link>
        </div>
        <LowStockPanel />
      </div>
    </div>
  )
}
