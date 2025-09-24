'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, MapPin, Phone, ArrowLeft, Home, ShoppingCart, Download, Camera, Share } from 'lucide-react'
import { getSupportInfo } from '@/lib/restaurant-config'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  specialInstructions: string
}

interface OrderDetails {
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  tableNumber?: string
  scheduledTime?: string
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE'
  isPreOrder: boolean
  preOrderDate?: string
  preOrderMealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER'
}

interface OrderData {
  items: OrderItem[]
  customer: CustomerInfo
  orderDetails: OrderDetails
  total: number
  subtotal: number
  deliveryFee: number
  orderNumber: string
  orderDate: string
}

export default function OrderSuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Get order data from sessionStorage
    const storedOrderData = sessionStorage.getItem('lastOrderData')
    if (storedOrderData) {
      try {
        setOrderData(JSON.parse(storedOrderData))
      } catch (error) {
        console.error('Error parsing order data:', error)
        setHasError(true)
      }
    } else {
      // No order data found - user may have navigated directly
      setHasError(true)
    }
    setIsLoading(false)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const downloadAsPDF = () => {
    // Create a new window with the order details for printing/PDF
    const printWindow = window.open('', '_blank')
    if (!printWindow || !orderData) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${orderData.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { color: #f97316; font-size: 28px; font-weight: bold; }
          .order-number { background: #f97316; color: white; padding: 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .section { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #f97316; }
          .customer-info { background: #f8f9fa; padding: 15px; border-radius: 5px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🍽️ Royal Food</div>
          <p>Premium Food Delivery Platform</p>
          <div class="order-number">Order #${orderData.orderNumber}</div>
          <p>Date: ${new Date(orderData.orderDate).toLocaleString()}</p>
        </div>

        <div class="section">
          <h3>Customer Information</h3>
          <div class="customer-info">
            <p><strong>Name:</strong> ${orderData.customer.name}</p>
            <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
            ${orderData.customer.email ? `<p><strong>Email:</strong> ${orderData.customer.email}</p>` : ''}
            ${orderData.customer.address ? `<p><strong>Address:</strong> ${orderData.customer.address}</p>` : ''}
            ${orderData.customer.specialInstructions ? `<p><strong>Instructions:</strong> ${orderData.customer.specialInstructions}</p>` : ''}
          </div>
        </div>

        <div class="section">
          <h3>Order Details</h3>
          <p><strong>Type:</strong> ${orderData.orderDetails.orderType}</p>
          <p><strong>Payment:</strong> ${orderData.orderDetails.paymentMethod}</p>
          ${orderData.orderDetails.isPreOrder ? `
            <p><strong>Pre-order Date:</strong> ${orderData.orderDetails.preOrderDate}</p>
            <p><strong>Meal Type:</strong> ${orderData.orderDetails.preOrderMealType}</p>
          ` : ''}
        </div>

        <div class="section">
          <h3>Order Items</h3>
          ${orderData.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="item">
            <span>Subtotal:</span>
            <span>${formatCurrency(orderData.subtotal)}</span>
          </div>
          ${orderData.deliveryFee > 0 ? `
            <div class="item">
              <span>Delivery Fee:</span>
              <span>${formatCurrency(orderData.deliveryFee)}</span>
            </div>
          ` : ''}
          <div class="item total">
            <span>Total:</span>
            <span>${formatCurrency(orderData.total)}</span>
          </div>
        </div>

        <div class="section" style="text-align: center; margin-top: 40px;">
          <p>Thank you for your order!</p>
          <p>🍽️ Royal Food - Premium Food Delivery Platform</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const saveAsImage = async () => {
    if (!orderData) return
    
    try {
      // Create a canvas to generate the receipt image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 600
      canvas.height = 800

      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Header
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('🍽️ Royal Food', canvas.width / 2, 40)
      
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.fillText('Premium Food Delivery Platform', canvas.width / 2, 65)

      // Order number
      ctx.fillStyle = '#f97316'
      ctx.fillRect(200, 80, 200, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Order #${orderData.orderNumber}`, canvas.width / 2, 105)

      // Content
      let y = 150
      ctx.fillStyle = '#333333'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'

      // Customer info
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Customer Information:', 50, y)
      y += 30
      ctx.font = '14px Arial'
      ctx.fillText(`Name: ${orderData.customer.name}`, 50, y)
      y += 25
      ctx.fillText(`Phone: ${orderData.customer.phone}`, 50, y)
      y += 25

      if (orderData.customer.address) {
        ctx.fillText(`Address: ${orderData.customer.address}`, 50, y)
        y += 25
      }

      y += 20
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Order Items:', 50, y)
      y += 30

      ctx.font = '14px Arial'
      orderData.items.forEach(item => {
        ctx.fillText(`${item.name} x${item.quantity}`, 50, y)
        ctx.textAlign = 'right'
        ctx.fillText(formatCurrency(item.price * item.quantity), 550, y)
        ctx.textAlign = 'left'
        y += 25
      })

      y += 20
      ctx.fillText('Subtotal:', 50, y)
      ctx.textAlign = 'right'
      ctx.fillText(formatCurrency(orderData.subtotal), 550, y)
      ctx.textAlign = 'left'
      y += 25

      if (orderData.deliveryFee > 0) {
        ctx.fillText('Delivery Fee:', 50, y)
        ctx.textAlign = 'right'
        ctx.fillText(formatCurrency(orderData.deliveryFee), 550, y)
        ctx.textAlign = 'left'
        y += 25
      }

      y += 10
      ctx.font = 'bold 16px Arial'
      ctx.fillStyle = '#f97316'
      ctx.fillText('Total:', 50, y)
      ctx.textAlign = 'right'
      ctx.fillText(formatCurrency(orderData.total), 550, y)

      // Download the image
      const link = document.createElement('a')
      link.download = `Royal-Food-Order-${orderData.orderNumber}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order information...</p>
        </div>
      </div>
    )
  }

  if (hasError || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Information Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your order information. This may happen if you navigated directly to this page.
          </p>
          <div className="space-y-3">
            <Link href="/public/order">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Place New Order
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              If you just placed an order and see this message, please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your order. We're preparing your delicious meal!</p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-orange-600 text-2xl">
                Order #{orderData.orderNumber}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Placed on {new Date(orderData.orderDate).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Save Options */}
              <div className="flex flex-wrap gap-3 justify-center pb-6 border-b">
                <Button 
                  onClick={downloadAsPDF}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Save as PDF
                </Button>
                <Button 
                  onClick={saveAsImage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Save as Image
                </Button>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {orderData.customer.name}</p>
                    <p><strong>Phone:</strong> {orderData.customer.phone}</p>
                    {orderData.customer.email && (
                      <p><strong>Email:</strong> {orderData.customer.email}</p>
                    )}
                    {orderData.customer.address && (
                      <p><strong>Address:</strong> {orderData.customer.address}</p>
                    )}
                    {orderData.customer.specialInstructions && (
                      <p><strong>Special Instructions:</strong> {orderData.customer.specialInstructions}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Order Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Order Type:</strong> {orderData.orderDetails.orderType}</p>
                    <p><strong>Payment Method:</strong> {orderData.orderDetails.paymentMethod}</p>
                    {orderData.orderDetails.isPreOrder && (
                      <>
                        <p><strong>Pre-order Date:</strong> {orderData.orderDetails.preOrderDate}</p>
                        <p><strong>Meal Type:</strong> {orderData.orderDetails.preOrderMealType}</p>
                      </>
                    )}
                    {orderData.orderDetails.tableNumber && (
                      <p><strong>Table Number:</strong> {orderData.orderDetails.tableNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderData.items.map((item, index) => (
                    <div key={`order-item-${item.id || index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.category && (
                          <p className="text-sm text-gray-600">{item.category}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">x{item.quantity}</p>
                        <p className="text-orange-600 font-bold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderData.subtotal)}</span>
                  </div>
                  {orderData.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(orderData.deliveryFee)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold text-orange-600">
                    <span>Total</span>
                    <span>{formatCurrency(orderData.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-3 p-4 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
                <div className="text-center">
                  <p className="font-semibold text-orange-900">Order Received</p>
                  <p className="text-sm text-orange-700">Estimated preparation time: 25-35 minutes</p>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Order Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Order confirmed</span>
                    <span className="text-xs text-gray-500 ml-auto">Just now</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
                    <span className="text-sm text-gray-700">Preparing your order</span>
                    <span className="text-xs text-gray-500 ml-auto">~5 mins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      {orderData.orderDetails.orderType === 'DELIVERY' ? 'Out for delivery' : 'Ready for pickup'}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">~20 mins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      {orderData.orderDetails.orderType === 'DELIVERY' ? 'Delivered' : 'Completed'}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">~35 mins</span>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please keep your phone available for delivery updates</li>
                  <li>• Have exact change ready if paying by cash</li>
                  <li>• Check your order upon {orderData.orderDetails.orderType === 'DELIVERY' ? 'delivery' : 'pickup'}</li>
                  <li>• Contact us immediately if there are any issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/public/order" className="flex-1">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Order Again
              </Button>
            </Link>
          </div>

          {/* Contact Support */}
          <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
            <div className="flex justify-center gap-4">
              <a href={`tel:${getSupportInfo().phone}`} className="text-orange-600 hover:text-orange-700 font-semibold">
                📞 Call Support
              </a>
              {getSupportInfo().whatsapp && (
                <a href={`https://wa.me/${getSupportInfo().whatsapp?.replace(/[^0-9]/g, '') || ''}`} className="text-green-600 hover:text-green-700 font-semibold">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}