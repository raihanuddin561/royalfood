'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Calendar, DollarSign, Receipt } from 'lucide-react'
import { BaseModal, Button } from '@/components/ui/Modal'
import { ExpenseType, ExpenseStatus, RecurringPeriod } from '@prisma/client'
import { SmartPriceInput } from '@/components/ui/SmartPriceInput'

interface ExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ExpenseCategory {
  id: string
  name: string
  type: ExpenseType
  description?: string
}

export default function ExpenseForm({ isOpen, onClose, onSuccess }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    expenseCategoryId: '',
    description: '',
    amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
    receiptImage: '',
    supplierInfo: '',
    taxAmount: '',
    isRecurring: false,
    recurringPeriod: 'MONTHLY' as RecurringPeriod,
    nextDueDate: '',
    notes: '',
    status: 'APPROVED' as ExpenseStatus
  })

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/expense-categories')
      if (res.ok) {
        const cats = await res.json()
        setCategories(cats || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.expenseCategoryId) {
      newErrors.expenseCategoryId = 'Category is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const payload = {
        expenseCategoryId: formData.expenseCategoryId,
        description: formData.description,
        amount: Number(parseFloat(String(formData.amount)) || 0),
        expenseDate: formData.expenseDate,
        receiptImage: formData.receiptImage || undefined,
        supplierInfo: formData.supplierInfo || undefined,
        taxAmount: Number(parseFloat(String(formData.taxAmount)) || 0),
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
        nextDueDate: formData.isRecurring && formData.nextDueDate ? formData.nextDueDate : undefined,
        notes: formData.notes || undefined,
        status: formData.status
      }

      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          expenseCategoryId: '',
          description: '',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          receiptImage: '',
          supplierInfo: '',
          taxAmount: '',
          isRecurring: false,
          recurringPeriod: 'MONTHLY',
          nextDueDate: '',
          notes: '',
          status: 'APPROVED'
        })
      } else if (res) {
        const err = await res.json().catch(() => null)
        console.error('Failed to create expense:', err)
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Expense"
      description="Create a new expense record"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-0 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Category *
              </label>
              <select
                value={formData.expenseCategoryId}
                onChange={(e) => handleInputChange('expenseCategoryId', e.target.value)}
                className={`block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.expenseCategoryId ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type})
                  </option>
                ))}
              </select>
              {errors.expenseCategoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.expenseCategoryId}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter expense description"
                className={`block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.description ? 'border-red-300' : ''
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Amount and Tax */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <SmartPriceInput
                  value={parseFloat(formData.amount) || 0}
                  onChange={(value: number) => handleInputChange('amount', value.toString())}
                  currency="৳"
                  placeholder="0.00"
                  className={`${
                    errors.amount ? 'border-red-300' : ''
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Amount
                </label>
                <SmartPriceInput
                  value={parseFloat(formData.taxAmount) || 0}
                  onChange={(value: number) => handleInputChange('taxAmount', value.toString())}
                  currency="৳"
                  placeholder="0.00"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                    className={`block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.expenseDate ? 'border-red-300' : ''
                    }`}
                  />
                </div>
                  <div className="mt-2 flex space-x-2">
                    <button type="button" onClick={() => handleInputChange('expenseDate', new Date().toISOString().split('T')[0])} className="text-sm text-blue-600 hover:underline">Today</button>
                    <button type="button" onClick={() => handleInputChange('expenseDate', '')} className="text-sm text-gray-600 hover:underline">Clear</button>
                  </div>
                {errors.expenseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Supplier Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier/Vendor Information
              </label>
              <input
                type="text"
                value={formData.supplierInfo}
                onChange={(e) => handleInputChange('supplierInfo', e.target.value)}
                placeholder="Enter supplier or vendor name"
                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                  This is a recurring expense
                </label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Period
                    </label>
                    <select
                      value={formData.recurringPeriod}
                      onChange={(e) => handleInputChange('recurringPeriod', e.target.value)}
                      className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => handleInputChange('nextDueDate', e.target.value)}
                      className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                placeholder="Additional notes or comments"
                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Image
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={formData.receiptImage}
                  onChange={(e) => handleInputChange('receiptImage', e.target.value)}
                  placeholder="Receipt image URL"
                  className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="primary" type="submit" loading={loading}>{loading ? 'Creating...' : 'Create Expense'}</Button>
            </div>
          </form>
    </BaseModal>
  )
}
