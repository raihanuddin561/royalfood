'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  MapPin,
  User,
  Package,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useNotification } from '@/components/ui/Notification'

interface Order {
  id: string
  orderNumber: string
  orderType: string
  status: string
  totalAmount: number
  estimatedTime: number | null
  createdAt: string
  customer?: {
    id: string
    name: string
    email: string
    phone: string
  }
  guestName?: string
  guestPhone?: string
  guestAddress?: string
  deliveryAddress?: {
    address: string
    city: string
    landmark?: string
  }
  orderItems: Array<{
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem?: {
      name: string
      image?: string
    }
  }>
}

interface OrderStatistics {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  preparingOrders: number
}

export default function AdminOrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    preparingOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const { showNotification } = useNotification()

  useEffect(() => {
    loadOrders()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '20'
      })
      
      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
        setStatistics(data.statistics)
      } else {
        showNotification('error', 'Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      showNotification('error', 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updating) return
    
    setUpdating(orderId)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })
      
      const data = await response.json()
      if (data.success) {
        showNotification('success', `Order status updated to ${newStatus}`)
        loadOrders()
      } else {
        showNotification('error', data.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      showNotification('error', 'Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'COMPLETED'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Orders Dashboard</h1>
          <p className="text-sm text-gray-600">Manage customer orders and track delivery status</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.todayOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.todayRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.pendingOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Preparing</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.preparingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">#{order.orderNumber}</h3>
                <p className="text-sm text-gray-500">{formatDateTime(new Date(order.createdAt))}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {order.customer?.name || order.guestName || 'Guest'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {order.customer?.phone || order.guestPhone || 'No phone'}
                </span>
              </div>
              
              {(order.deliveryAddress || order.guestAddress) && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">
                    {order.deliveryAddress?.address || order.guestAddress}
                    {order.deliveryAddress?.city && `, ${order.deliveryAddress.city}`}
                  </span>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
              <div className="space-y-1">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}× {item.menuItem?.name || 'Unknown'}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Order Actions */}
            <div className="border-t pt-4">
              <div className="flex space-x-2">
                {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                  <>
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        disabled={updating === order.id}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {updating === order.id ? 'Updating...' : `Mark ${getNextStatus(order.status)}`}
                      </button>
                    )}
                    
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      disabled={updating === order.id}
                      className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
                
                {order.status === 'COMPLETED' && (
                  <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                    ✅ Order Completed
                  </div>
                )}
              </div>
            </div>

            {/* Order Type Badge */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {order.orderType.replace('_', ' ')}
              </span>
              {order.estimatedTime && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {order.estimatedTime} min
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all' ? 'Try changing the filter.' : 'No customer orders yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
