'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, MapPin, Phone, Mail, Calendar, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency-config'

type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItem?: {
    name: string
    image?: string
  }
}

type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  totalAmount: number
  estimatedTime?: number
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestAddress?: string
  tableNumber?: string
  notes?: string
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
  orderDate: string
  confirmedAt?: string
  preparingAt?: string
  readyAt?: string
  deliveredAt?: string
  orderItems: OrderItem[]
  orderTracking: OrderTracking[]
}

type OrderTracking = {
  id: string
  status: OrderStatus
  notes?: string
  createdAt: string
}

const statusSteps: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'PENDING', label: 'Order Placed', description: 'Your order has been received' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Order confirmed by restaurant' },
  { status: 'PREPARING', label: 'Preparing', description: 'Your food is being prepared' },
  { status: 'READY', label: 'Ready', description: 'Order is ready for pickup/delivery' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Driver is on the way' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Order has been delivered' }
]

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-500'
    case 'CONFIRMED': return 'bg-blue-500'
    case 'PREPARING': return 'bg-orange-500'
    case 'READY': return 'bg-green-500'
    case 'OUT_FOR_DELIVERY': return 'bg-purple-500'
    case 'DELIVERED': return 'bg-green-600'
    case 'CANCELLED': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusIndex = (status: OrderStatus): number => {
  return statusSteps.findIndex(step => step.status === status)
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.customer) {
            setIsLoggedIn(true)
            loadUserOrders()
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
    
    checkAuthStatus()
  }, [])

  const loadUserOrders = async () => {
    try {
      const response = await fetch('/api/public/orders/my-orders')
      if (response.ok) {
        const data = await response.json()
        setUserOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to load user orders:', error)
    }
  }

  const searchOrder = async () => {
    if (!orderNumber.trim() || !phoneNumber.trim()) {
      toast.error('Please enter both order number and phone number')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/public/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phoneNumber)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOrder(data.order)
        } else {
          setError(data.error || 'Order not found')
          setOrder(null)
        }
      } else {
        setError('Failed to fetch order details')
        setOrder(null)
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      setError('Failed to track order')
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1

  const getFilteredSteps = (orderType: string) => {
    if (orderType === 'DINE_IN' || orderType === 'TAKEAWAY') {
      return statusSteps.filter(step => step.status !== 'OUT_FOR_DELIVERY')
    }
    return statusSteps
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-yellow-50/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-base lg:text-lg text-gray-600">
            {isLoggedIn ? 'View your order history and track current orders' : 'Enter your order details to track status'}
          </p>
        </div>

        {/* User Orders Section (for logged in users) */}
        {isLoggedIn && userOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Recent Orders</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userOrders.slice(0, 6).map((userOrder) => (
                <Card 
                  key={userOrder.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedOrderId === userOrder.id ? 'ring-2 ring-orange-500 border-orange-300' : ''
                  }`}
                  onClick={() => {
                    setOrder(userOrder)
                    setSelectedOrderId(userOrder.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">#{userOrder.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(userOrder.orderDate)}</p>
                      </div>
                      <Badge className={`${getStatusColor(userOrder.status)} text-white text-xs`}>
                        {userOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{formatCurrency(userOrder.totalAmount)}</span>
                      <span className="text-xs text-gray-500 capitalize">{userOrder.orderType.replace('_', ' ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Form for Guest Users or Manual Search */}
        {!isLoggedIn && (
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Search className="w-5 h-5 mr-2" />
                Find Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g., ORD-12345"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button 
                onClick={searchOrder} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Track Order'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="max-w-md mx-auto mb-8 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.orderNumber}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      Placed on {formatDate(order.orderDate)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Customer Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {order.guestName}</p>
                      <p><strong>Phone:</strong> {order.guestPhone}</p>
                      {order.guestEmail && (
                        <p><strong>Email:</strong> {order.guestEmail}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Order Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Type:</strong> {order.orderType.replace('_', ' ')}</p>
                      {order.tableNumber && (
                        <p><strong>Table:</strong> {order.tableNumber}</p>
                      )}
                      {order.guestAddress && (
                        <p><strong>Address:</strong> {order.guestAddress}</p>
                      )}
                      <p><strong>Total:</strong> {formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                {order.isPreOrder && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center text-blue-800">
                      <Calendar className="w-4 h-4 mr-2" />
                      Pre-order Details
                    </h3>
                    <p className="text-blue-700">
                      Scheduled for: {order.scheduledDate && formatDate(order.scheduledDate)}
                      {order.scheduledTime && ` - ${order.scheduledTime}`}
                    </p>
                  </div>
                )}

                {order.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Special Instructions</h3>
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Order Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredSteps(order.orderType).map((step, index) => {
                    const isCompleted = index <= currentStatusIndex
                    const isCurrent = index === currentStatusIndex
                    
                    return (
                      <div key={step.status} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isCurrent 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </div>
                          {index < getFilteredSteps(order.orderType).length - 1 && (
                            <div className={`w-0.5 h-12 mt-2 ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className={`font-medium ${
                            isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </h3>
                          <p className={`text-sm ${
                            isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                          {/* Show timestamp if available */}
                          {step.status === 'CONFIRMED' && order.confirmedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              {formatTime(order.confirmedAt)}
                            </p>
                          )}
                          {step.status === 'PREPARING' && order.preparingAt && (
                            <p className="text-xs text-green-600 mt-1">
                              {formatTime(order.preparingAt)}
                            </p>
                          )}
                          {step.status === 'READY' && order.readyAt && (
                            <p className="text-xs text-green-600 mt-1">
                              {formatTime(order.readyAt)}
                            </p>
                          )}
                          {step.status === 'DELIVERED' && order.deliveredAt && (
                            <p className="text-xs text-green-600 mt-1">
                              {formatTime(order.deliveredAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {order.estimatedTime && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <p className="text-orange-800">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Estimated preparation time: {order.estimatedTime} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.menuItem?.name || 'Item'}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-orange-600">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {order.orderTracking && order.orderTracking.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.orderTracking
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((tracking) => (
                        <div key={tracking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{tracking.status.replace('_', ' ')}</p>
                            {tracking.notes && (
                              <p className="text-sm text-gray-600">{tracking.notes}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(tracking.createdAt)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
