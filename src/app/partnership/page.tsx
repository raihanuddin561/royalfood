 'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Partner = {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  sharePercent: number
  isActive: boolean
  createdAt: string
}

export default function PartnershipPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [distribution, setDistribution] = useState<any>(null)

  useEffect(() => {
    loadPartners()
    loadDistribution()
  }, [])

  async function loadPartners() {
    setLoading(true)
    try {
      const res = await fetch('/api/partners')
      const json = await res.json()
      if (json.success) setPartners(json.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDistribution() {
    try {
      const res = await fetch('/api/partnership/distribution')
      const json = await res.json()
      if (json.success) setDistribution(json.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleActive(id: string, value: boolean) {
    try {
      const res = await fetch('/api/partners', { method: 'PATCH', body: JSON.stringify({ id, isActive: value }) })
      const json = await res.json()
      if (json.success) loadPartners()
    } catch (err) { console.error(err) }
  }

  async function updatePercent(id: string, sharePercent: number) {
    try {
      const res = await fetch('/api/partners', { method: 'PATCH', body: JSON.stringify({ id, sharePercent }) })
      const json = await res.json()
      if (json.success) {
        loadPartners()
        loadDistribution()
      }
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Partnership Management</h1>
          <p className="mt-2 text-sm text-gray-700">Manage partners and their share percentages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Partners</h3>
            <div className="space-y-4">
              {partners.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.email} • {p.phone}</div>
                    <div className="text-xs text-gray-400">Joined: {formatDate(p.createdAt)}</div>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <input
                        type="number"
                        value={p.sharePercent}
                        onChange={(e) => updatePercent(p.id, parseFloat(e.target.value || '0'))}
                        className="w-20 rounded-md border px-2 py-1 text-sm"
                      />
                      <div className="text-xs text-gray-500">%</div>
                    </div>
                    <div>
                      <label className="inline-flex items-center">
                        <input type="checkbox" checked={p.isActive} onChange={(e) => toggleActive(p.id, e.target.checked)} />
                        <span className="ml-2 text-sm">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Current Distribution</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Total Distributable:</div>
              <div className="text-2xl font-bold">{formatCurrency(distribution?.totalDistributable || 0)}</div>
            </div>

            <div className="space-y-3">
              {(distribution?.partners || []).map((sp: any) => (
                <div key={sp.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{sp.name} <span className="text-xs text-gray-500">({sp.sharePercent}%)</span></div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(sp.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
