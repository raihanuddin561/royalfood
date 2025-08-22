'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator, TrendingUp, DollarSign, Package, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createDailySale, getAvailableItems } from '@/app/actions/sales'
import { BaseModal, Button, Message, Loading } from '@/components/ui/Modal'
import { Notification } from '@/components/ui/Notification'

interface Item {
  id: string
  name: string
  categoryName: string
  unit: string
  currentStock: number
  costPrice: number
  sellingPrice: number
  profitMargin: number
}

interface SaleItem {
  itemId: string
  item: Item
  quantity: number
  sellingPrice: number
  total: number
  cost: number
  profit: number
}

export default function DailySalesPerItem() {
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER'>('CASH')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Load available items
  useEffect(() => {
    async function loadItems() {
      const result = await getAvailableItems()
      if (result.success) {
        setAvailableItems(result.data)
      }
    }
    loadItems()
  }, [])

  // Add item to sale
  const addItem = (item: Item) => {
    const existingIndex = saleItems.findIndex(saleItem => saleItem.itemId === item.id)
    
    if (existingIndex >= 0) {
      // Increase quantity if item already exists
      const updatedItems = [...saleItems]
      const existingItem = updatedItems[existingIndex]
      const newQuantity = existingItem.quantity + 1
      
      if (newQuantity > item.currentStock) {
        setNotification({
          type: 'error',
          message: `Cannot add more ${item.name}. Only ${item.currentStock} ${item.unit} available in stock.`
        })
        return
      }

      existingItem.quantity = newQuantity
      existingItem.total = existingItem.sellingPrice * newQuantity
      existingItem.cost = item.costPrice * newQuantity
      existingItem.profit = existingItem.total - existingItem.cost
      setSaleItems(updatedItems)
    } else {
      // Add new item
      const newSaleItem: SaleItem = {
        itemId: item.id,
        item,
        quantity: 1,
        sellingPrice: item.sellingPrice,
        total: item.sellingPrice,
        cost: item.costPrice,
        profit: item.sellingPrice - item.costPrice
      }
      setSaleItems([...saleItems, newSaleItem])
    }
  }

  // Update quantity
  const updateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...saleItems]
    const saleItem = updatedItems[index]
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      updatedItems.splice(index, 1)
    } else if (quantity > saleItem.item.currentStock) {
      setNotification({
        type: 'error',
        message: `Only ${saleItem.item.currentStock} ${saleItem.item.unit} available for ${saleItem.item.name}`
      })
      return
    } else {
      saleItem.quantity = quantity
      saleItem.total = saleItem.sellingPrice * quantity
      saleItem.cost = saleItem.item.costPrice * quantity
      saleItem.profit = saleItem.total - saleItem.cost
    }
    
    setSaleItems(updatedItems)
  }

  // Update selling price
  const updateSellingPrice = (index: number, price: number) => {
    if (price < 0) return
    
    const updatedItems = [...saleItems]
    const saleItem = updatedItems[index]
    saleItem.sellingPrice = price
    saleItem.total = price * saleItem.quantity
    saleItem.profit = saleItem.total - saleItem.cost
    setSaleItems(updatedItems)
  }

  // Remove item
  const removeItem = (index: number) => {
    const updatedItems = [...saleItems]
    updatedItems.splice(index, 1)
    setSaleItems(updatedItems)
  }

  // Calculate totals
  const totals = saleItems.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.total,
      totalCost: acc.totalCost + item.cost,
      totalProfit: acc.totalProfit + item.profit,
      totalQuantity: acc.totalQuantity + item.quantity
    }),
    { subtotal: 0, totalCost: 0, totalProfit: 0, totalQuantity: 0 }
  )

  const finalAmount = Math.max(0, totals.subtotal - discountAmount)
  const netProfit = finalAmount - totals.totalCost
  const profitMargin = finalAmount > 0 ? (netProfit / finalAmount) * 100 : 0

  // Handle sale submission
  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please add at least one item to the sale'
      })
      return
    }

    setLoading(true)
    setShowConfirmModal(false)

    try {
      const result = await createDailySale({
        items: saleItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice
        })),
        paymentMethod,
        discountAmount,
        notes
      })

      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message
        })
        // Reset form
        setSaleItems([])
        setDiscountAmount(0)
        setNotes('')
        // Reload items to update stock
        const itemsResult = await getAvailableItems()
        if (itemsResult.success) {
          setAvailableItems(itemsResult.data)
        }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Daily Sales Per Item</h1>
          <p className="mt-2 text-sm text-gray-700">
            Record sales by selecting items and quantities with real-time profit calculation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Items: {saleItems.length}</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(finalAmount)}</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowConfirmModal(true)}
            disabled={saleItems.length === 0 || loading}
            loading={loading}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Items */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Available Items</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">{availableItems.length} items in stock</p>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {availableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.categoryName}</p>
                        <p className="text-sm text-blue-600 font-medium">
                          {formatCurrency(item.sellingPrice)} / {item.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {item.currentStock} {item.unit}
                        </p>
                        <p className="text-xs text-green-600">
                          {item.profitMargin.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sale Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Sale Items</h2>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-gray-600">
                    Qty: <span className="font-medium">{totals.totalQuantity}</span>
                  </div>
                  <div className="text-blue-600">
                    Revenue: <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="text-green-600">
                    Profit: <span className="font-medium">{formatCurrency(totals.totalProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {saleItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No items added to sale</p>
                  <p className="text-sm text-gray-400">Click on items from the left to add them to your sale</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {saleItems.map((saleItem, index) => (
                    <div key={`${saleItem.itemId}-${index}`} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{saleItem.item.name}</h3>
                          <p className="text-sm text-gray-500">{saleItem.item.categoryName}</p>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity ({saleItem.item.unit})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={saleItem.item.currentStock}
                            value={saleItem.quantity}
                            onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max: {saleItem.item.currentStock}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Price per {saleItem.item.unit}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={saleItem.sellingPrice}
                            onChange={(e) => updateSellingPrice(index, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Cost: {formatCurrency(saleItem.item.costPrice)}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                            <p className="font-medium text-gray-900">{formatCurrency(saleItem.total)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Cost: {formatCurrency(saleItem.cost)}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Profit</label>
                          <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="font-medium text-green-700">{formatCurrency(saleItem.profit)}</p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            {saleItem.total > 0 ? ((saleItem.profit / saleItem.total) * 100).toFixed(1) : 0}% margin
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {saleItems.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="DIGITAL_WALLET">Digital Wallet</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Amount (Optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={totals.subtotal}
                            step="0.01"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Any additional notes..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                          Sale Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Discount:</span>
                              <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Final Amount:</span>
                            <span className="text-green-600">{formatCurrency(finalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-blue-600">
                            <span>Total Cost:</span>
                            <span>{formatCurrency(totals.totalCost)}</span>
                          </div>
                          <div className="flex justify-between text-green-600 font-bold">
                            <span>Net Profit:</span>
                            <span>{formatCurrency(netProfit)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Profit Margin:</span>
                            <span>{profitMargin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <BaseModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Sale"
        description="Please review the sale details before proceeding"
        type="success"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Sale Summary</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{saleItems.length} ({totals.totalQuantity} units)</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Expected Profit:</span>
                <span>{formatCurrency(netProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              Review Again
            </Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
            >
              Confirm Sale
            </Button>
          </div>
        </div>
      </BaseModal>

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
