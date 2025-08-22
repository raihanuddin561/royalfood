'use client'

import { useState } from 'react'
import { DollarSign, CreditCard, Smartphone, Building2, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createQuickSale } from '@/app/actions/sales'
import { Button } from '@/components/ui/Modal'
import { Notification } from '@/components/ui/Notification'

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: DollarSign, color: 'green' },
  { value: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
  { value: 'DIGITAL_WALLET', label: 'Digital Wallet', icon: Smartphone, color: 'purple' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2, color: 'indigo' }
] as const

export default function QuickSalePage() {
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER'>('CASH')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(totalAmount)
    if (!amount || amount <= 0) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid sale amount greater than 0'
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('totalAmount', totalAmount)
      formData.append('paymentMethod', paymentMethod)
      formData.append('notes', notes)

      const result = await createQuickSale(formData)

      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message
        })
        // Reset form
        setTotalAmount('')
        setNotes('')
      } else {
        setNotification({
          type: 'error',
          message: result.message
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to record sale. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const amount = parseFloat(totalAmount) || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quick Sale Entry</h1>
        <p className="mt-2 text-sm text-gray-700">
          Enter total sale amount directly for quick transactions
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <Receipt className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Sale Details</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                BDT
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                placeholder="0.00"
                required
              />
            </div>
            {amount > 0 && (
              <p className="mt-2 text-center text-sm text-gray-600">
                Amount: <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.value
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      isSelected
                        ? `border-${method.color}-500 bg-${method.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-3 ${
                        isSelected ? `text-${method.color}-600` : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        isSelected ? `text-${method.color}-900` : 'text-gray-700'
                      }`}>
                        {method.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Any additional details about this sale..."
            />
          </div>

          {/* Sale Preview */}
          {amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Sale Preview</h3>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{paymentMethods.find(m => m.value === paymentMethod)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTotalAmount('')
                setNotes('')
              }}
              className="flex-1"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={loading}
              disabled={!amount || amount <= 0}
              className="flex-1"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Record Sale
            </Button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Quick Sale Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Use this for quick transactions when you don't need detailed item tracking</p>
          <p>• For detailed profit analysis, use the "Daily Sales Per Item" feature instead</p>
          <p>• This records total revenue but doesn't update inventory stock levels</p>
          <p>• Perfect for miscellaneous sales, services, or when you need speed over detail</p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
