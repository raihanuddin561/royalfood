 'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/Modal'
import { useNotification } from '@/components/ui/Notification'

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
  const { showNotification } = useNotification()
  const [partners, setPartners] = useState<Partner[]>([])
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; partner?: any }>>([])
  const [loading, setLoading] = useState(true)
  const [distribution, setDistribution] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [selectedSharePercent, setSelectedSharePercent] = useState<number | ''>(0)

  useEffect(() => {
    loadPartners()
  loadUsers()
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

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users')
      // this endpoint returns an array of users (admin-only)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      // only include users who are not currently assigned as partners
      const available = (list as any[]).filter(u => !u.partner)
      setUsers(available)
      if (available.length > 0 && !selectedUserId) setSelectedUserId(available[0].id)
    } catch (err) {
      console.error('Failed to load users for partner assignment', err)
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
      const res = await fetch('/api/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sharePercent, skipNormalize: true })
      })
      const json = await res.json()
      if (json.success) {
        loadPartners()
        loadDistribution()
      }
    } catch (err) { console.error(err) }
  }

  async function assignUserAsPartner() {
    if (!selectedUserId) return
    setAssigning(true)
    try {
      // Find the selected user details
      const user = users.find(u => u.id === selectedUserId)
      if (!user) throw new Error('User not found')

      // Validate share percent input (if provided)
      let sp: number = 0
      if (selectedSharePercent === '') {
        sp = 0
      } else {
        sp = Number(selectedSharePercent)
        if (isNaN(sp) || sp < 0 || sp > 100) throw new Error('share percent must be between 0 and 100')
      }

      // Before creating, check if a partner with this email exists
      const allRes = await fetch('/api/partners')
      const allJson = await allRes.json()
      const existing = (allJson?.data || []).find((p: any) => p.email === user.email)

      if (existing) {
        // Show confirmation modal before overwriting existing partner
        setConfirmPayload({ user, existingPartner: existing, sharePercent: sp })
        setShowConfirm(true)
        setAssigning(false)
        return
      }

      // Create a partner record using user's basic info
      const createRes = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, sharePercent: sp, isActive: true })
      })
      const created = await createRes.json()
      if (!created || !created.success) {
        throw new Error(created?.error || 'Failed to create partner')
      }

      const partner = created.data

      // Assign partnerId to user via admin users PATCH
      const assignRes = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id })
      })
      const assignJson = await assignRes.json()
      if (assignRes.status >= 400) {
        throw new Error(assignJson?.error || 'Failed to assign partner to user')
      }

      // Refresh lists
      await loadPartners()
      await loadUsers()
      await loadDistribution()
    } catch (err) {
      console.error('Failed to assign user as partner', err)
      showNotification('error', String(err), 'Assignment Failed')
    } finally {
      setAssigning(false)
    }
  }

  // Confirmation modal state for existing partner
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState<any>(null)

  async function confirmOverwrite() {
    if (!confirmPayload) return
    setShowConfirm(false)
    setAssigning(true)
    try {
      const { user, sharePercent } = confirmPayload
      // Upsert will update existing record (already handled server-side), just call POST
      const createRes = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, sharePercent, isActive: true })
      })
      const created = await createRes.json()
      if (!created || !created.success) throw new Error(created?.error || 'Failed to update partner')

      const partner = created.data
      // assign to user
      const assignRes = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id })
      })
      const assignJson = await assignRes.json()
      if (assignRes.status >= 400) throw new Error(assignJson?.error || 'Failed to assign partner to user')

      await loadPartners()
      await loadUsers()
      await loadDistribution()
      showNotification('success', 'Partner updated and assigned', 'Success')
    } catch (err) {
      console.error(err)
      showNotification('error', String(err), 'Assignment Failed')
    } finally {
      setAssigning(false)
      setConfirmPayload(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <>
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
            <div className="mb-4 border-b pb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Make a user a Partner</h4>
              <div className="flex items-center gap-2">
                <select className="p-2 border rounded" value={selectedUserId || ''} onChange={(e) => setSelectedUserId(e.target.value || null)}>
                  {users.length === 0 && <option value="">No available users</option>}
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-24 p-2 border rounded text-sm"
                    value={selectedSharePercent as any}
                    onChange={(e) => {
                      const v = e.target.value
                      setSelectedSharePercent(v === '' ? '' : parseFloat(v))
                    }}
                    placeholder="%"
                  />
                  <div className="text-sm text-gray-600">%</div>
                </div>
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  onClick={assignUserAsPartner}
                  disabled={assigning || !selectedUserId}
                >
                  {assigning ? 'Assigning...' : 'Make Partner'}
                </button>
              </div>
            </div>
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

      {/* Confirmation modal for existing partner overwrite */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Existing partner found"
        description="A partner with the selected user's email already exists. Do you want to update that partner's details and assign them to this user?"
        onConfirm={confirmOverwrite}
        onCancel={() => { setShowConfirm(false); setConfirmPayload(null) }}
        confirmLabel="Yes, update and assign"
        cancelLabel="Cancel"
      />
    </>
  )
}
