'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MapPin,
  Phone,
  FileText,
  ShoppingCart,
  Utensils,
  DollarSign
} from 'lucide-react'
import { getOrderById, deleteOrder, updateOrderStatus } from '@/app/actions/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { OrderStatus } from '@prisma/client'

// Helper function to get status badge style
function getStatusBadgeStyle(status: string) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800', 
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    SERVED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
}

// Helper function to get status icon
function getStatusIcon(status: string) {
  const statusIcons = {
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    PREPARING: Utensils,
    READY: AlertCircle,
    SERVED: CheckCircle,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle
  }
  const IconComponent = statusIcons[status as keyof typeof statusIcons] || Clock
  return <IconComponent className="h-4 w-4" />
}

interface OrderData {
  id: string
  orderNumber: string
  orderType: string
  status: string
  tableNumber?: string | null
  customerName?: string | null
  customerPhone?: string | null
  totalAmount: number
  taxAmount: number
  discountAmount: number
  finalAmount: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes?: string | null
    menuItem?: {
      id: string
      name: string
      price: number
      category: {
        name: string
      }
    } | null
    item?: {
      id: string
      name: string
      sellingPrice: number
      category: {
        name: string
      }
    } | null
  }>
  sale?: any
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load order data
  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string)
    }
  }, [params.id])

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await getOrderById(orderId)
      
      if (result.success && result.order) {
        setOrder(result.order as OrderData)
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

  // Update order status
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return

    setUpdating(true)
    try {
      const result = await updateOrderStatus(order.id, newStatus)
      
      if (result.success) {
        setOrder({ ...order, status: newStatus })
      } else {
        setError(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  // Delete order
  const handleDeleteOrder = async () => {
    if (!order) return

    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    setUpdating(true)
    try {
      const result = await deleteOrder(order.id)
      
      if (result.success) {
        router.push('/orders')
      } else {
        setError(result.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('Failed to delete order')
    } finally {
      setUpdating(false)
    }
  }

  // Get available status transitions
  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions: Record<string, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['SERVED'],
      SERVED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: []
    }
    return transitions[currentStatus] || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
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

  const availableTransitions = getAvailableStatusTransitions(order.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Order details and status information
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href={`/orders/${order.id}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Order
          </Link>
          
          <button
            onClick={handleDeleteOrder}
            disabled={updating}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Order Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Order Information</h2>
                  <p className="text-sm text-gray-600">Created {formatDateTime(order.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeStyle(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Type</label>
                    <p className="mt-1 text-sm text-gray-900">{order.orderType.replace('_', ' ')}</p>
                  </div>

                  {order.tableNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Table Number
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{order.tableNumber}</p>
                    </div>
                  )}

                  {order.customerName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <User className="inline h-4 w-4 mr-1" />
                        Customer Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{order.customerName}</p>
                    </div>
                  )}

                  {order.customerPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Phone Number
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{order.customerPhone}</p>
                    </div>
                  )}
                </div>

                {/* Staff & Time Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">{order.user.name}</p>
                    <p className="text-xs text-gray-500">{order.user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Order Items ({order.orderItems.length})
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.menuItem?.name || item.item?.name || 'Unknown Item'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {item.menuItem?.category?.name || item.item?.category?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Actions */}
        <div className="lg:col-span-1">
          {/* Status Actions */}
          {availableTransitions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-2">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updating}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">Mark as {status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>
              
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount:</span>
                  <span className="text-green-600">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-base font-medium text-gray-900">{formatCurrency(order.finalAmount)}</span>
                </div>
              </div>
            </div>

            {order.sale && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Payment completed
                </p>
              </div>
            )}
          </div>

          {/* Order Timeline */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Order Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-gray-900">Order created</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
              
              {order.createdAt.getTime() !== order.updatedAt.getTime() && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">Status: {order.status.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
