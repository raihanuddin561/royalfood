'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  Minus,
  ShoppingCart,
  Clock,
  User,
  MapPin,
  Phone,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { getOrderById, updateOrder, deleteOrder } from '@/app/actions/orders'
import { OrderType, OrderStatus } from '@prisma/client'

// Mock menu items (in real app, fetch from API)
const mockMenuItems = [
  { id: '1', name: 'Chicken Biryani', price: 180, category: { name: 'Main Course' } },
  { id: '2', name: 'Beef Curry', price: 220, category: { name: 'Main Course' } },
  { id: '3', name: 'Fish Fry', price: 200, category: { name: 'Main Course' } },
  { id: '4', name: 'Mango Lassi', price: 80, category: { name: 'Beverages' } },
  { id: '5', name: 'Samosa', price: 30, category: { name: 'Appetizers' } }
]

interface OrderItem {
  id?: string
  menuItemId?: string
  itemId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  name: string
}

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order form state
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN')
  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [discountAmount, setDiscountAmount] = useState(0)

  // Load order data
  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string)
    }
  }, [params.id])

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true)
      const result = await getOrderById(orderId)
      
      if (result.success && result.order) {
        const order = result.order
        setOrderType(order.orderType as OrderType)
        setStatus(order.status as OrderStatus)
        setTableNumber(order.tableNumber || '')
        setCustomerName(order.customerName || '')
        setCustomerPhone(order.customerPhone || '')
        setNotes(order.notes || '')
        setDiscountAmount(order.discountAmount || 0)
        
        // Convert order items to form format
        const items = order.orderItems.map(item => ({
          id: item.id,
          menuItemId: item.menuItemId,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
          name: item.menuItem?.name || item.item?.name || 'Unknown Item'
        }))
        setOrderItems(items)
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxRate = 0.05 // 5% tax
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount - discountAmount

  // Add item to order
  const addToOrder = (menuItem: typeof mockMenuItems[0]) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id)
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      setOrderItems([...orderItems, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price
      }])
    }
  }

  // Update item quantity
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter((_, i) => i !== index))
    } else {
      setOrderItems(orderItems.map((item, i) =>
        i === index
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item
      ))
    }
  }

  // Remove item from order
  const removeFromOrder = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  // Save order
  const saveOrder = async () => {
    if (!session?.user) return

    setSaving(true)
    setError(null)

    try {
      const orderData = {
        userId: session.user.id,
        orderType,
        status,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
        customerName: orderType !== 'DINE_IN' ? customerName : null,
        customerPhone: orderType !== 'DINE_IN' ? customerPhone : null,
        totalAmount: subtotal,
        taxAmount,
        discountAmount,
        finalAmount: total,
        notes,
        orderItems: orderItems.map(item => ({
          id: item.id,
          menuItemId: item.menuItemId,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes
        }))
      }

      const result = await updateOrder(params.id as string, orderData)
      
      if (result.success) {
        router.push('/orders')
      } else {
        setError(result.error || 'Failed to save order')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      setError('Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  // Delete order
  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const result = await deleteOrder(params.id as string)
      
      if (result.success) {
        router.push('/orders')
      } else {
        setError(result.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('Failed to delete order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error && !orderItems.length) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error Loading Order</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Link
            href="/orders"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/orders"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Order</h1>
            <p className="mt-2 text-sm text-gray-700">
              Update order details and items
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleDeleteOrder}
            disabled={saving}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </button>
          
          <button
            onClick={saveOrder}
            disabled={saving || orderItems.length === 0}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
              
              {/* Order Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>

              {/* Order Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="SERVED">Served</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Table Number for Dine In */}
              {orderType === 'DINE_IN' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., Table 1"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Customer Details for Takeaway/Delivery */}
              {orderType !== 'DINE_IN' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}

              {/* Discount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or notes..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%):</span>
                  <span>৳{taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items & Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Menu Items */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Available Items</h2>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {mockMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.category.name}</p>
                        <p className="text-sm font-medium text-green-600">৳{item.price}</p>
                      </div>
                      <button
                        onClick={() => addToOrder(item)}
                        className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Order Items */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Order Items ({orderItems.length})
                </h2>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p>No items in order</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                      >
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">৳{item.unitPrice} each</p>
                          <p className="text-sm font-medium text-green-600">৳{item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromOrder(index)}
                            className="ml-2 inline-flex items-center p-1 border border-red-300 rounded text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
