'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Utensils,
  Receipt,
  Eye,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency-config'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItem: {
    name: string
    image?: string
  }
}

type Order = {
  id: string
  orderNumber: string
  status: string
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  subtotal: number
  taxAmount: number
  deliveryFee: number
  totalAmount: number
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
  notes?: string
  orderItems: OrderItem[]
  createdAt: string
  estimatedTime: number
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/orders/my-orders')
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to view your orders')
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error(data.error || 'Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'CONFIRMED': return 'bg-blue-500'
      case 'PREPARING': return 'bg-orange-500'
      case 'READY': return 'bg-green-500'
      case 'OUT_FOR_DELIVERY': return 'bg-purple-500'
      case 'SERVED': return 'bg-green-600'
      case 'COMPLETED': return 'bg-green-700'
      case 'CANCELLED': return 'bg-red-500'
      case 'REFUNDED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />
      case 'PREPARING': return <Utensils className="h-4 w-4" />
      case 'READY': return <Package className="h-4 w-4" />
      case 'OUT_FOR_DELIVERY': return <Truck className="h-4 w-4" />
      case 'SERVED': return <CheckCircle className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      case 'REFUNDED': return <RotateCcw className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'DELIVERY': return <Truck className="h-4 w-4" />
      case 'TAKEAWAY': return <Package className="h-4 w-4" />
      case 'DINE_IN': return <Utensils className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.orderItems.some(item => item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'amount-high':
          return b.totalAmount - a.totalAmount
        case 'amount-low':
          return a.totalAmount - b.totalAmount
        default:
          return 0
      }
    })

  const reorderItems = (order: Order) => {
    // Navigate to order page with pre-filled cart
    const cartItems = order.orderItems.map(item => ({
      menuItemId: item.id,
      name: item.menuItem.name,
      price: item.unitPrice,
      quantity: item.quantity
    }))
    
    // Store in session storage for the order page to pick up
    sessionStorage.setItem('reorderItems', JSON.stringify(cartItems))
    router.push('/public/order')
    toast.success('Items added to cart for reordering!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and view order history</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders or items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PREPARING">Preparing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="SERVED">Served</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                  <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {orders.length === 0 ? 'No orders yet' : 'No orders found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {orders.length === 0 
                  ? "You haven't placed any orders yet. Start browsing our delicious menu!"
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {orders.length === 0 && (
                <Link href="/public/order">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Browse Menu
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              #{order.orderNumber}
                            </h3>
                            <Badge className={`${getStatusColor(order.status)} text-white font-medium px-3 py-1`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              {getOrderTypeIcon(order.orderType)}
                              {order.orderType === 'DELIVERY' ? 'Delivery' : 
                               order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              ~{order.estimatedTime} mins
                            </span>
                          </div>

                          {order.isPreOrder && (
                            <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                              <Calendar className="h-4 w-4" />
                              Pre-order for {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'scheduled date'}
                              {order.scheduledTime && ` (${order.scheduledTime})`}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="text-sm">
                          {order.orderItems.slice(0, 3).map((item, index) => (
                            <span key={item.id}>
                              {item.quantity}× {item.menuItem.name}
                              {index < Math.min(order.orderItems.length, 3) - 1 && ', '}
                            </span>
                          ))}
                          {order.orderItems.length > 3 && (
                            <span className="text-gray-500">
                              {' '}and {order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-48">
                      <Link href={`/order/success?orderId=${order.id}`}>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => reorderItems(order)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reorder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/public/order">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Package className="h-4 w-4 mr-2" />
              Place New Order
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              <ChevronRight className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}