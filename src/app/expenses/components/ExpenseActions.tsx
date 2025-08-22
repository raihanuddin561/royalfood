'use client'

import { useState } from 'react'
import { Edit, Trash2, X, DollarSign, Calendar, FileText, Building, Tag, Receipt } from 'lucide-react'
import { ExpenseStatus, ExpenseType } from '@prisma/client'

interface Expense {
  id: string
  description: string
  amount: number
  expenseDate: Date
  status: ExpenseStatus
  receiptImage?: string
  supplierInfo?: string
  taxAmount: number
  isRecurring: boolean
  notes?: string
  expenseCategory: {
    id: string
    name: string
    type: ExpenseType
  }
  payroll?: {
    employee: {
      user: {
        name: string
      }
    }
  }
  employee?: {
    user: {
      name: string
    }
  }
  purchase?: {
    supplier: {
      name: string
    }
  }
}

interface ExpenseCategory {
  id: string
  name: string
  type: ExpenseType
}

interface ExpenseActionsProps {
  expense: Expense
  categories: ExpenseCategory[]
  onUpdate: () => void
}

export default function ExpenseActions({ expense, categories, onUpdate }: ExpenseActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    expenseCategoryId: expense.expenseCategory.id,
    description: expense.description,
    amount: expense.amount,
    expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
    status: expense.status,
    supplierInfo: expense.supplierInfo || '',
    taxAmount: expense.taxAmount || 0,
    notes: expense.notes || ''
  })

  const handleEdit = () => {
    setFormData({
      expenseCategoryId: expense.expenseCategory.id,
      description: expense.description,
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      status: expense.status,
      supplierInfo: expense.supplierInfo || '',
      taxAmount: expense.taxAmount || 0,
      notes: expense.notes || ''
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        taxAmount: parseFloat(formData.taxAmount.toString()),
        expenseDate: formData.expenseDate
      }

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setShowEditModal(false)
        onUpdate()
        alert('Expense updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteModal(false)
        onUpdate()
        alert('Expense deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <>
      <div className="flex items-center justify-end space-x-2">
        {expense.receiptImage && (
          <button
            className="text-blue-600 hover:text-blue-900 p-1 rounded"
            title="View Receipt"
            onClick={() => window.open(expense.receiptImage, '_blank')}
          >
            <Receipt className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleEdit}
          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
          title="Edit Expense"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:text-red-900 p-1 rounded"
          title="Delete Expense"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Expense</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Tag className="inline h-4 w-4 mr-1" />
                    Category
                  </label>
                  <select
                    value={formData.expenseCategoryId}
                    onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Amount</label>
                  <input
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ExpenseStatus })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Building className="inline h-4 w-4 mr-1" />
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplierInfo}
                    onChange={(e) => setFormData({ ...formData, supplierInfo: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Supplier name or info"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Additional notes or details..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this expense?
              </p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                <p className="text-sm text-gray-600">{formatCurrency(expense.amount)}</p>
                <p className="text-xs text-gray-500">{new Date(expense.expenseDate).toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                This action cannot be undone and will affect financial reports.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
