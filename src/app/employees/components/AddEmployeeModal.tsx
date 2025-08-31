"use client"

import { useState } from 'react'
import { BaseModal, Button } from '@/components/ui/Modal'
import { useNotification } from '@/components/ui/Notification'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => Promise<void>
}

export default function AddEmployeeModal({ isOpen, onClose, onCreated }: Props) {
  const { showNotification } = useNotification()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    position: 'Kitchen',
    department: 'Kitchen',
  salary: '',
  payMode: 'DAILY',
  hourlyRate: '',
  standardHoursPerDay: '8',
    password: ''
  })

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Employee"
      description="Create a new employee account and assign department/role"
      size="md"
    >
      <form onSubmit={async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
          const payload = {
            email: form.email,
            name: form.name,
            password: form.password || 'password123',
            role: 'EMPLOYEE',
            employeeId: form.employeeId,
            position: form.position,
            department: form.department,
            salary: Number(form.salary || 0),
            payMode: form.payMode,
            hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
            standardHoursPerDay: Number(form.standardHoursPerDay || 8)
          }

          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (res.ok) {
            onClose()
            setForm({ name: '', email: '', employeeId: '', position: 'Kitchen', department: 'Kitchen', salary: '', payMode: 'DAILY', hourlyRate: '', standardHoursPerDay: '8', password: '' })
            if (onCreated) await onCreated()
          } else {
            const err = await res.json()
            showNotification('error', err.error || 'Failed to create employee')
          }
        } catch (err) {
          console.error(err)
          showNotification('error', 'Network error')
        } finally {
          setCreating(false)
        }
      }}>
        <div className="grid grid-cols-1 gap-2">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-2 border rounded" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="p-2 border rounded" />
          <input required placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="p-2 border rounded" />
          <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="p-2 border rounded">
            <option>Kitchen</option>
            <option>Service</option>
            <option>Management</option>
            <option>Cleaning</option>
            <option>Security</option>
          </select>
          <input type="number" placeholder="Salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="p-2 border rounded" />
          <label className="flex items-center gap-2">
            <span className="text-sm">Pay mode</span>
            <select value={form.payMode} onChange={(e) => setForm({ ...form, payMode: e.target.value })} className="p-2 border rounded">
              <option value="DAILY">Daily (salary ÷ 30)</option>
              <option value="HOURLY">Hourly (use hourly rate)</option>
            </select>
          </label>
          <input type="number" placeholder="Hourly rate (optional)" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="p-2 border rounded" />
          <input type="number" placeholder="Standard hours per day" value={form.standardHoursPerDay} onChange={(e) => setForm({ ...form, standardHoursPerDay: e.target.value })} className="p-2 border rounded" />
          <input placeholder="Password (optional)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="p-2 border rounded" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={creating}>Cancel</Button>
          <Button variant="primary" type="submit" loading={creating}>{creating ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  )
}
