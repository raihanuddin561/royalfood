"use client"

import { useState, useEffect } from 'react'
import { BaseModal, Button } from '@/components/ui/Modal'
import { useNotification } from '@/components/ui/Notification'

interface Props {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
  date?: string // YYYY-MM-DD, defaults to today
  onSaved?: () => Promise<void>
}

export default function EditAttendanceModal({ isOpen, onClose, employeeId, employeeName, date, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState<string>('')
  const [recordPayroll, setRecordPayroll] = useState<boolean>(false)
  const [useHoursProration, setUseHoursProration] = useState<boolean>(true)
  const [theDate, setTheDate] = useState<string>(date || new Date().toISOString().split('T')[0])
  const [standardHours, setStandardHours] = useState<number>(8)
  const { showNotification } = useNotification()

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/attendance/${employeeId}?date=${theDate}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.attendance) {
          setHours(String(json.attendance.totalHours ?? ''))
        } else {
          setHours('')
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [isOpen, employeeId, theDate])

  const save = async () => {
    setLoading(true)
    try {
      const payload = { date: theDate, totalHours: hours === '' ? null : Number(hours) }
      const res = await fetch(`/api/attendance/${employeeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.success) {
        if (onSaved) await onSaved()
        // Optionally record payroll for this date immediately
        if (recordPayroll) {
          try {
            const q = new URLSearchParams({ date: theDate, useHoursProration: String(useHoursProration), respectAttendance: 'true', standardHoursPerDay: String(standardHours) })
            const r = await fetch(`/api/record-salary-expenses?${q.toString()}`)
            const rr = await r.json()
            if (!rr.success) {
              console.error('Failed to record payroll:', rr)
              showNotification('error', 'Attendance saved but failed to record payroll. Check server logs.')
            }
          } catch (err) {
            console.error(err)
            showNotification('error', 'Attendance saved but failed to record payroll (network error).')
          }
        }

        onClose()
      } else {
        showNotification('error', json.message || 'Failed to save attendance')
      }
    } catch (err) {
      console.error(err)
      showNotification('error', 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Edit Attendance — ${employeeName}`} description={`Edit work hours for ${employeeName} on ${theDate}`} size="sm">
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Total Hours</label>
        <input type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="p-2 border rounded" placeholder="e.g. 8" />
        <label className="text-sm text-gray-700">Date</label>
        <input type="date" value={theDate} onChange={(e) => setTheDate(e.target.value)} className="p-2 border rounded" />
        <div className="pt-2 border-t mt-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={recordPayroll} onChange={(e) => setRecordPayroll(e.target.checked)} />
            <span className="text-sm">Record payroll for this date (prorate by hours)</span>
          </label>
          {recordPayroll && (
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useHoursProration} onChange={(e) => setUseHoursProration(e.target.checked)} />
                <span className="text-sm">Use hours proration (pay by recorded hours)</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm">Standard hours/day</label>
                <input type="number" value={standardHours} onChange={(e) => setStandardHours(Number(e.target.value || 8))} className="p-1 border rounded w-20" />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={loading}>Save</Button>
        </div>
      </div>
    </BaseModal>
  )
}
