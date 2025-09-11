'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, MapPin, Phone, Calendar, ShoppingBag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Order = {
  id: string
  orderNumber: string
  status: string
  orderType: string
  totalAmount: number
  orderDate: string
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
  orderItems: Array<{
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem?: { name: string }
  }>
}

const getStatusColor = (status: string): string => {
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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const searchOrders = async () => {
    if (!customerEmail.trim() || !customerPhone.trim()) {
      alert('Please enter both email and phone number')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/public/customers/orders?email=${encodeURIComponent(customerEmail)}&phone=${encodeURIComponent(customerPhone)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOrders(data.orders)
          setHasSearched(true)
        } else {
          alert(data.error || 'No orders found')
          setOrders([])
        }
      } else {
        alert('Failed to fetch orders')
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('Failed to fetch orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/public/order">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-gray-600">View your order history and track current orders</p>
          </div>
        </div>

        {/* Search Form */}
        {!hasSearched && (
          <Card className="max-w-md mx-auto mb-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Search className="w-5 h-5 mr-2" />
                Find Your Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your registered email"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button 
                onClick={searchOrders} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'View My Orders'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Orders ({orders.length})</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setHasSearched(false)
                  setOrders([])
                  setCustomerEmail('')
                  setCustomerPhone('')
                }}
              >
                Search Again
              </Button>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Order Info */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {formatDate(order.orderDate)} at {formatTime(order.orderDate)}
                            </p>
                            <p className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {order.orderType.replace('_', ' ')}
                            </p>
                            {order.isPreOrder && order.scheduledDate && (
                              <p className="flex items-center text-blue-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                Scheduled: {formatDate(order.scheduledDate)}
                                {order.scheduledTime && ` - ${order.scheduledTime}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Items ({order.orderItems.length})
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {order.orderItems.slice(0, 3).map((item, index) => (
                              <p key={index}>
                                {item.quantity}× {item.menuItem?.name || 'Item'} - ₹{item.totalPrice}
                              </p>
                            ))}
                            {order.orderItems.length > 3 && (
                              <p className="text-gray-500">+{order.orderItems.length - 3} more items</p>
                            )}
                          </div>
                        </div>

                        {/* Total & Actions */}
                        <div className="flex flex-col justify-between">
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              ₹{order.totalAmount}
                            </p>
                            <p className="text-sm text-gray-500">Total Amount</p>
                          </div>
                          <div className="mt-4">
                            <Link href={`/public/order/track`}>
                              <Button variant="outline" className="w-full">
                                Track Order
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
                  <p className="text-gray-500 mb-6">
                    No orders found for the provided email and phone number.
                  </p>
                  <Link href="/public/order">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Place Your First Order
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
