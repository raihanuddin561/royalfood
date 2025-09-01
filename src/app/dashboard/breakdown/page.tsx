"use client"

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency as formatCurrencyUtil } from '@/lib/currency-config'

function formatCurrency(v: number) {
  return formatCurrencyUtil(v)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white p-2 rounded shadow">
      <div className="text-xs text-gray-500">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center space-x-2">
          <div style={{ width: 10, height: 10, background: p?.stroke || '#000', borderRadius: 2 }} />
          <div className="text-sm text-gray-800">{p.name}: <span className="font-mono">{formatCurrency(Number(p.value || 0))}</span></div>
        </div>
      ))}
    </div>
  )
}

function downloadCSV(filename: string, rows: string) {
  const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DetailedBreakdownPage() {
  const [startDate, setStartDate] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSeries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchSeries() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      const res = await fetch(`/api/financials/breakdown/series?${params.toString()}`)
      const json = await res.json()
      if (json?.success) {
        setSeries(json.data || [])
      } else {
        setSeries([])
      }
    } catch (err) {
      console.error('Failed to fetch detailed series', err)
      setSeries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border-gray-300" />
        <span className="text-sm text-gray-500">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border-gray-300" />
        <button onClick={fetchSeries} className="ml-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">{loading ? 'Loading...' : 'Load'}</button>
      </div>

      <div className="bg-white rounded-lg p-4 border">
        <h3 className="text-lg font-semibold mb-2">Effective Total Expenses (range)</h3>
        {series.length === 0 ? (
          <p className="text-sm text-gray-500">No data</p>
        ) : (
          <>
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => {
                  // Build CSV
                  const headers = ['date','cogs','effectiveTotalExpenses','payroll_expenses','operational_expenses','other_expenses']
                  const rows = series.map(s => headers.map(h => JSON.stringify(s[h] ?? '')).join(',')).join('\n')
                  const csv = headers.join(',') + '\n' + rows
                  downloadCSV(`financial-breakdown-${startDate}_to_${endDate}.csv`, csv)
                }}
                className="px-3 py-1 bg-gray-100 rounded text-sm border"
              >
                Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="cogs" name="COGS" stroke="#1f77b4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="effectiveTotalExpenses" name="Effective Expenses" stroke="#ff7f0e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="payroll_expenses" name="Payroll" stroke="#2ca02c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="operational_expenses" name="Operational" stroke="#d62728" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="other_expenses" name="Other" stroke="#9467bd" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
