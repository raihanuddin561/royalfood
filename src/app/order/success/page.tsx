'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  ShoppingBag,
  CreditCard,
  Truck,
  Calendar,
  Timer,
  Receipt,
  Star,
  Heart,
  Share
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency-config'
import { toast } from 'sonner'
import Link from 'next/link'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
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
  estimatedTime: number
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
  notes?: string
  
  // Customer info
  customerId?: string
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestAddress?: string
  
  // Order items
  orderItems: OrderItem[]
  
  // Timestamps
  createdAt: string
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(true)

  const orderId = searchParams.get('orderId')
  const token = searchParams.get('token') // For guest access

  useEffect(() => {
    if (!orderId) {
      router.push('/public/order')
      return
    }

    fetchOrderDetails()
  }, [orderId, token])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      
      // Try authenticated request first (for registered users)
      let response = await fetch(`/api/public/orders/track?orderId=${orderId}`)
      
      // If unauthorized and we have a token, try guest access
      if (!response.ok && token) {
        response = await fetch(`/api/public/orders/track?orderId=${orderId}&token=${token}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setOrder(data.order)
        setIsGuest(!data.order.customerId)
      } else {
        toast.error('Order not found or access denied')
        router.push('/public/order')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
      router.push('/public/order')
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
      default: return 'bg-gray-500'
    }
  }

  const getEstimatedDeliveryTime = () => {
    if (!order) return null
    
    const orderTime = new Date(order.createdAt)
    const estimatedTime = new Date(orderTime.getTime() + (order.estimatedTime * 60000))
    
    return estimatedTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order ${order?.orderNumber}`,
        text: `My order from Royal Food - ${order?.orderNumber}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Order link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link href="/public/order">
            <Button>Back to Menu</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">Thank you for your order. We're preparing it now.</p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
                <p className="text-blue-100">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${getStatusColor(order.status)} text-white font-bold px-3 py-1`}>
                  {order.status}
                </Badge>
                <p className="text-blue-100 text-sm mt-1">
                  {order.orderType === 'DELIVERY' ? 'Delivery' : 
                   order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Estimated Time */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Timer className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">
                    Estimated {order.orderType === 'DELIVERY' ? 'Delivery' : 'Ready'} Time
                  </span>
                </div>
                <span className="text-blue-600 font-bold text-lg">
                  {getEstimatedDeliveryTime()}
                </span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                Approximately {order.estimatedTime} minutes from order time
              </p>
            </div>

            {/* Pre-order Info */}
            {order.isPreOrder && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-800">Pre-Order Scheduled</span>
                </div>
                <p className="text-purple-600 mt-1">
                  Date: {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'Not specified'}
                  {order.scheduledTime && ` | Time: ${order.scheduledTime}`}
                </p>
              </div>
            )}

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {order.guestName || 'Registered Customer'}
                  </p>
                  {order.guestPhone && (
                    <p className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.guestPhone}
                    </p>
                  )}
                  {order.guestEmail && (
                    <p className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {order.guestEmail}
                    </p>
                  )}
                </div>
              </div>

              {order.orderType === 'DELIVERY' && order.guestAddress && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Delivery Address
                  </h3>
                  <p className="text-gray-600">{order.guestAddress}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Order Items ({order.orderItems.length})
              </h3>
              <div className="space-y-3">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">{item.quantity}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500">Note: {item.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Order Total
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Special Instructions</h4>
                <p className="text-yellow-700">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button onClick={shareOrder} variant="outline" className="flex items-center">
            <Share className="h-4 w-4 mr-2" />
            Share Order
          </Button>
          
          {!isGuest && (
            <Link href="/my-orders">
              <Button className="flex items-center">
                <Receipt className="h-4 w-4 mr-2" />
                View Order History
              </Button>
            </Link>
          )}
          
          <Link href="/public/order">
            <Button variant="outline">
              Order Again
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Guest Notice */}
        {isGuest && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Want to track your orders?
              </h3>
              <p className="text-blue-700 mb-4">
                Create an account to track your orders, save favorites, and get exclusive offers!
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/auth/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}