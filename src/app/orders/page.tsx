'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ShoppingCart,
  DollarSign,
  Users,
  Utensils
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { deleteOrder, getOrdersWithStats } from '@/app/actions/orders'
import Link from 'next/link'

interface OrderData {
  id: string
  orderNumber: string
  orderType: string
  status: string
  tableNumber?: string | null
  customerId?: string | null
  customerName?: string | null
  totalAmount: number
  taxAmount: number
  discountAmount: number
  finalAmount: number
  createdAt: Date
  user: {
    name: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    menuItem?: {
      name: string
      price: number
    } | null
    item?: {
      name: string
      sellingPrice: number
    } | null
  }>
}

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [todayOrdersCount, setTodayOrdersCount] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Load orders data
  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await getOrdersWithStats()
      
      if (result.success) {
        setOrders(result.orders as OrderData[])
        setTodayOrdersCount(result.todayOrdersCount)
        setTodayRevenue(result.todayRevenue)
        setStatusCounts(result.statusCounts)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    setDeleting(orderId)
    try {
      const result = await deleteOrder(orderId)
      
      if (result.success) {
        // Remove order from local state
        setOrders(orders.filter(order => order.id !== orderId))
        // Reload to get updated stats
        loadOrders()
        alert('Order deleted successfully!')
      } else {
        alert(`Failed to delete order: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(null)
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate statistics from current orders
  const pendingOrders = orders.filter(order => order.status === 'PENDING').length
  const preparingOrders = orders.filter(order => order.status === 'PREPARING').length
  const readyOrders = orders.filter(order => order.status === 'READY').length

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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer orders and track order status
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Today's Orders</dt>
                <dd className="text-lg font-medium text-gray-900">{todayOrdersCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Today's Revenue</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(todayRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Preparing</dt>
                <dd className="text-lg font-medium text-gray-900">{preparingOrders}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Ready to Serve</dt>
                <dd className="text-lg font-medium text-gray-900">{readyOrders}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Quick Status Overview</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { status: 'PENDING', count: pendingOrders, label: 'Pending' },
              { status: 'CONFIRMED', count: statusCounts.CONFIRMED || 0, label: 'Confirmed' },
              { status: 'PREPARING', count: preparingOrders, label: 'Preparing' },
              { status: 'READY', count: readyOrders, label: 'Ready' },
              { status: 'SERVED', count: statusCounts.SERVED || 0, label: 'Served' },
              { status: 'COMPLETED', count: statusCounts.COMPLETED || 0, label: 'Completed' },
              { status: 'CANCELLED', count: statusCounts.CANCELLED || 0, label: 'Cancelled' }
            ].map((item) => (
              <div key={item.status} className="text-center">
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeStyle(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span className="ml-2">{item.count}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="SERVED">Served</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Order Type Filter */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Types</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Order Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Time</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {order.orderType.replace('_', ' ')} 
                        {order.tableNumber && ` • Table ${order.tableNumber}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {order.customerId ? 'Customer ID: ' + order.customerId : (order.customerName || 'Walk-in')}
                  </div>
                  <div className="text-sm text-gray-500">Staff: {order.user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.orderItems.slice(0, 2).map((item, index) => (
                      <div key={index}>
                        {item.quantity}x {item.menuItem?.name || item.item?.name}
                      </div>
                    ))}
                    {order.orderItems.length > 2 && (
                      <div>+{order.orderItems.length - 2} more...</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.finalAmount)}
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="text-xs text-green-600">
                      -{formatCurrency(order.discountAmount)} discount
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyle(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(order.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link 
                      href={`/orders/${order.id}/edit`}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Edit Order"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deleting === order.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first order.'
            }
          </p>
          <div className="mt-6">
            <Link
              href="/orders/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </div>
        </div>
      )}

      {/* Recent Orders Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Orders by Type Today</h3>
            <div className="space-y-4">
              {['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map((type) => {
                const typeOrders = orders.filter(order => 
                  order.orderType === type && 
                  order.createdAt >= new Date(new Date().setHours(0,0,0,0))
                )
                const typeRevenue = typeOrders.reduce((sum, order) => sum + order.finalAmount, 0)
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="text-sm text-gray-500">{typeOrders.length} orders</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(typeRevenue)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Kitchen Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Preparing</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{preparingOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Ready to Serve</span>
                </div>
                <span className="text-lg font-bold text-green-600">{readyOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Pending Confirmation</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{pendingOrders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
