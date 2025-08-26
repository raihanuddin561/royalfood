'use client'

import { useState } from 'react'
import { Edit, Trash2, User, Mail, Calendar, DollarSign, X } from 'lucide-react'
import { BaseModal, ConfirmModal, Button } from '@/components/ui/Modal'

interface Employee {
  id: string
  name: string
  email: string
  employeeId: string
  position: string
  department: string
  salary: number
  hourlyRate: number | null
  hireDate: string
  isActive: boolean
}

interface EmployeeActionsProps {
  employee: Employee
  onUpdate: () => void
}

export default function EmployeeActions({ employee, onUpdate }: EmployeeActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    employeeId: employee.employeeId,
    position: employee.position,
    department: employee.department,
    salary: employee.salary,
    hourlyRate: employee.hourlyRate || '',
    hireDate: employee.hireDate.split('T')[0], // Format for input[type="date"]
    isActive: employee.isActive
  })

  const handleEdit = () => {
    setFormData({
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      hourlyRate: employee.hourlyRate || '',
      hireDate: employee.hireDate.split('T')[0],
      isActive: employee.isActive
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        ...formData,
        salary: parseFloat(formData.salary.toString()),
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate.toString()) : null,
        hireDate: new Date(formData.hireDate)
      }

      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setShowEditModal(false)
        onUpdate()
        alert('Employee updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/employees/${employee.id}?soft=true`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteModal(false)
        onUpdate()
        alert('Employee deactivated successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Failed to delete employee')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/employees/${employee.id}/toggle`, {
        method: 'POST'
      })

      if (response.ok) {
        onUpdate()
        const result = await response.json()
        alert(result.message)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling employee status:', error)
      alert('Failed to toggle employee status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-900 p-1 rounded"
          title="Edit Employee"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:text-red-900 p-1 rounded"
          title="Delete Employee"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={toggleStatus}
          className={`px-2 py-1 text-xs rounded ${
            employee.isActive
              ? 'text-red-600 hover:bg-red-50'
              : 'text-green-600 hover:bg-green-50'
          }`}
          title={employee.isActive ? 'Deactivate' : 'Activate'}
        >
          {employee.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <BaseModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Employee" description="Update employee details" size="md">
          <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="Kitchen">Kitchen</option>
                  <option value="Service">Service</option>
                  <option value="Management">Management</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Monthly Salary
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate (Optional)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active Employee
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading}>Cancel</Button>
                <Button variant="primary" type="submit" loading={loading}>{loading ? 'Updating...' : 'Update Employee'}</Button>
              </div>
            </form>
        </BaseModal>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Deactivate Employee"
        description={`Are you sure you want to deactivate ${employee.name}? This will preserve records for reporting.`}
        confirmLabel="Deactivate Employee"
        cancelLabel="Cancel"
        loading={loading}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}
