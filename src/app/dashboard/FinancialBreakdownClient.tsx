"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Breakdown = {
  totalRecordedExpenses: number
  recordedStockPurchases: number
  payrollExpenses: number
  operationalExpenses: number
  otherExpenses: number
  cogs: number
  effectiveTotalExpenses: number
}

export default function FinancialBreakdownClient() {
  const { data: session } = useSession()
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    fetchBreakdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function fetchBreakdown() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      const res = await fetch(`/api/financials/breakdown?${params.toString()}`)
      const json = await res.json()
      if (json?.success) setBreakdown(json.data)
      else setBreakdown(null)
    } catch (err) {
      console.error('Failed to fetch breakdown', err)
      setBreakdown(null)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <p className="text-sm text-gray-700">Sign in to view financial breakdown</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border-gray-300" />
        <span className="text-sm text-gray-500">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border-gray-300" />
        <button onClick={fetchBreakdown} disabled={loading} className="ml-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">{loading ? 'Loading...' : 'Refresh'}</button>
        <Link href="/dashboard/breakdown" className="ml-auto text-sm text-blue-600 underline">Detailed view →</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-gray-600">COGS</p>
          <p className="text-lg font-bold">{breakdown ? `৳${breakdown.cogs.toFixed(2)}` : '—'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-gray-600">Recorded Stock Purchases</p>
          <p className="text-lg font-bold">{breakdown ? `৳${breakdown.recordedStockPurchases.toFixed(2)}` : '—'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-gray-600">Effective Total Expenses</p>
          <p className="text-lg font-bold">{breakdown ? `৳${breakdown.effectiveTotalExpenses.toFixed(2)}` : '—'}</p>
        </div>
      </div>
    </div>
  )
}
