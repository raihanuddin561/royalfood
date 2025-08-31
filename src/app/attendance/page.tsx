"use client"

import { useEffect, useState } from 'react'
import { ConfirmModal } from '@/components/ui/Modal'
import { useNotification } from '@/components/ui/Notification'
import { useSession } from 'next-auth/react'
import EditAttendanceModal from '@/app/employees/components/EditAttendanceModal'

interface EmployeeRow {
  id: string
  name: string
  employeeId: string
  position: string
  department: string
  salary: number
  hourlyRate?: number | null
  isActive: boolean
  attendance?: { totalHours?: number | null }
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchMode, setBatchMode] = useState<'present'|'hours'|'absent'>('present')
  const [batchHours, setBatchHours] = useState<number | ''>(8)
  const { showNotification } = useNotification()
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [batchPayload, setBatchPayload] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?date=${date}`)
      const json = await res.json()
      if (json.success) {
        setEmployees(json.data || [])
      } else {
        console.error('Failed to fetch attendance list')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [date])

  if (loading) return <div className="p-6">Loading attendance...</div>

  const userRole = session?.user?.role as string | undefined
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Employee Attendance — {date}</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 border rounded" />
          <button onClick={fetchData} className="px-3 py-2 bg-blue-600 text-white rounded">Refresh</button>
          { (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
            <>
              <div className="flex items-center gap-2">
                <select value={batchMode} onChange={(e) => setBatchMode(e.target.value as any)} className="p-2 border rounded">
                  <option value="present">Mark Present (default hours)</option>
                  <option value="hours">Set Hours</option>
                  <option value="absent">Mark Absent</option>
                </select>
                {batchMode === 'hours' && (
                  <input type="number" value={batchHours} onChange={(e) => setBatchHours(e.target.value === '' ? '' : Number(e.target.value))} className="p-2 border rounded w-28" />
                )}
                <button onClick={async () => {
                  if (!selectedIds.length) return showNotification('error', 'Select employees first')
                  const payload = { date, employeeIds: selectedIds, mode: batchMode, hours: batchMode === 'hours' && batchHours !== '' ? Number(batchHours) : undefined }
                  setBatchPayload(payload)
                  setShowBatchConfirm(true)
                }} className="px-3 py-2 bg-emerald-600 text-white rounded">Apply to Selected</button>
              </div>
              <button onClick={async () => {
                const q = new URLSearchParams({ date, respectAttendance: 'true', useHoursProration: 'true', standardHoursPerDay: '8' })
                const res = await fetch(`/api/record-salary-expenses?${q.toString()}`)
                const j = await res.json()
                if (j.success) {
                  showNotification('success', 'Payroll recorded: ' + (j.result?.totalAmount ?? 0))
                  await fetchData()
                } else {
                  showNotification('error', 'Failed to record payroll')
                }
              }} className="px-3 py-2 bg-emerald-600 text-white rounded">Apply Payroll</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left w-12"><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedIds(employees.map(emp => emp.id)); else setSelectedIds([]) }} checked={selectedIds.length === employees.length && employees.length > 0} /></th>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Position</th>
              <th className="p-3 text-left">Hours</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={(e) => {
                  if (e.target.checked) setSelectedIds(prev => [...prev, emp.id])
                  else setSelectedIds(prev => prev.filter(id => id !== emp.id))
                }} /></td>
                <td className="p-3">{emp.name}</td>
                <td className="p-3">{emp.department}</td>
                <td className="p-3">{emp.position}</td>
                <td className="p-3">{emp.attendance?.totalHours ?? '-'}</td>
                <td className="p-3 text-right">
                  {canEdit ? (
                    <button onClick={() => { setSelectedEmployee({ id: emp.id, name: emp.name }); setAttendanceModalOpen(true) }} className="text-sm text-blue-600 hover:underline">Edit</button>
                  ) : (
                    <span className="text-sm text-gray-500">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <EditAttendanceModal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          date={date}
          onSaved={async () => { await fetchData() }}
        />
      )}
      <ConfirmModal
        isOpen={showBatchConfirm}
        title="Apply batch attendance"
        description="Apply the selected batch action to chosen employees?"
        onConfirm={async () => {
          setShowBatchConfirm(false)
          if (!batchPayload) return
          try {
            const res = await fetch('/api/attendance/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batchPayload) })
            const j = await res.json()
            if (j.success) {
              showNotification('success', `Batch attendance saved: ${j.total}`)
              setSelectedIds([])
              await fetchData()
            } else {
              showNotification('error', 'Failed to save batch attendance')
            }
          } catch (err) {
            showNotification('error', 'Failed to save batch attendance')
          }
        }}
        onCancel={() => setShowBatchConfirm(false)}
        confirmLabel="Apply"
        cancelLabel="Cancel"
      />
    </div>
  )
}
