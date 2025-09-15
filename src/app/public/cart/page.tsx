'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, MapPin, Phone, User, Clock, CreditCard, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  image?: string
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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    specialInstructions: ''
  })
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderType: 'DELIVERY',
    paymentMethod: 'CASH',
    isPreOrder: false
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('royal-food-cart')
    if (savedCart) {
      try {
        const rawCart = JSON.parse(savedCart)
        // Handle both old format (with 'id') and new format (with 'menuItemId')
        const normalizedCart = rawCart.map((item: any) => ({
          menuItemId: item.menuItemId || item.id, // Support both formats
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        }))
        setCart(normalizedCart)
      } catch (error) {
        console.error('Error loading cart:', error)
        // Clear corrupted data
        localStorage.removeItem('royal-food-cart')
      }
    }
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    if (cart.length > 0) {
      // Save in the consistent format that both pages can understand
      const cartForStorage = cart.map(item => ({
        id: item.menuItemId,        // For backward compatibility
        menuItemId: item.menuItemId, // For new format
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category
      }))
      localStorage.setItem('royal-food-cart', JSON.stringify(cartForStorage))
    }
  }, [cart])

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId)
      return
    }
    setCart(cart.map(item => 
      item.menuItemId === menuItemId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const removeItem = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId))
    toast.success('Item removed from cart')
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('royal-food-cart')
    toast.success('Cart cleared')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateDeliveryFee = () => {
    // TODO: This should come from admin settings, not be hardcoded
    // For now, return 0 until admin configures delivery charges
    return 0
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee()
  }

  // Helper functions for pre-order time restrictions
  const getCurrentDateTime = () => new Date()
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Ensure we get the local date in YYYY-MM-DD format
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMinimumDate = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const lunchDinnerCutoff = 10 * 60 + 30 // 10:30 AM
    
    // If it's before 10:30 AM, allow today for lunch/dinner
    if (currentTime <= lunchDinnerCutoff) {
      return getTodayDate()
    }
    // Otherwise, minimum is tomorrow
    return getTomorrowDate()
  }

  const isValidPreOrder = () => {
    if (!orderDetails.isPreOrder || !orderDetails.preOrderDate || !orderDetails.preOrderMealType) return true
    
    const selectedDate = new Date(orderDetails.preOrderDate)
    const currentDate = new Date()
    
    // Set selected date to start of day
    selectedDate.setHours(0, 0, 0, 0)
    
    // Current time for cutoff checks
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute // Convert to minutes
    
    // Define cutoff times in minutes from midnight
    const BREAKFAST_CUTOFF = 23 * 60 + 59 // 11:59 PM day before selected date
    const LUNCH_DINNER_CUTOFF = 10 * 60 + 30   // 10:30 AM on selected date
    
    if (orderDetails.preOrderMealType === 'BREAKFAST') {
      // For breakfast: must order before 11:59 PM the day before the selected date
      const dayBeforeSelected = new Date(selectedDate)
      dayBeforeSelected.setDate(dayBeforeSelected.getDate() - 1)
      dayBeforeSelected.setHours(23, 59, 0, 0) // 11:59 PM day before
      
      return currentDate <= dayBeforeSelected
    } 
    else if (orderDetails.preOrderMealType === 'LUNCH' || orderDetails.preOrderMealType === 'DINNER') {
      // For lunch/dinner: must order before 10:30 AM on the selected date
      const cutoffDateTime = new Date(selectedDate)
      cutoffDateTime.setHours(10, 30, 0, 0) // 10:30 AM on selected date
      
      return currentDate <= cutoffDateTime
    }
    
    return false
  }

  const getPreOrderMessage = () => {
    if (!orderDetails.isPreOrder) return ''
    if (!orderDetails.preOrderMealType) return 'Please select a meal type'
    
    const mealTimes = {
      BREAKFAST: '7:00 AM - 11:00 AM',
      LUNCH: '12:00 PM - 4:00 PM', 
      DINNER: '6:00 PM - 11:00 PM'
    }
    
    const cutoffTimes = {
      BREAKFAST: 'Order before 11:59 PM the day before selected date',
      LUNCH: 'Order before 10:30 AM on selected date',
      DINNER: 'Order before 10:30 AM on selected date'
    }
    
    return `Your ${orderDetails.preOrderMealType.toLowerCase()} will be prepared for ${mealTimes[orderDetails.preOrderMealType]}. ${cutoffTimes[orderDetails.preOrderMealType]}.`
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in your name and phone number')
      return
    }

    if (orderDetails.orderType === 'DELIVERY' && !customerInfo.address) {
      toast.error('Please provide delivery address')
      return
    }

    // Validate pre-order restrictions
    if (orderDetails.isPreOrder) {
      if (!orderDetails.preOrderDate) {
        toast.error('Please select a date for your pre-order')
        return
      }

      if (!isValidPreOrder()) {
        const now = new Date()
        const currentTime = now.toLocaleTimeString()
        const selectedDateStr = new Date(orderDetails.preOrderDate || '').toLocaleDateString()
        let errorMessage = ''
        
        if (orderDetails.preOrderMealType === 'BREAKFAST') {
          const dayBefore = new Date(orderDetails.preOrderDate || '')
          dayBefore.setDate(dayBefore.getDate() - 1)
          const dayBeforeStr = dayBefore.toLocaleDateString()
          errorMessage = `Breakfast for ${selectedDateStr} must be ordered before 11:59 PM on ${dayBeforeStr}. Current time: ${currentTime}`
        } else if (orderDetails.preOrderMealType === 'LUNCH' || orderDetails.preOrderMealType === 'DINNER') {
          errorMessage = `${orderDetails.preOrderMealType} for ${selectedDateStr} must be ordered before 10:30 AM on ${selectedDateStr}. Current time: ${currentTime}`
        } else {
          errorMessage = 'Invalid preorder time. Please check meal type and date selection.'
        }
        
        toast.error(errorMessage)
        return
      }

      if (!orderDetails.preOrderMealType) {
        toast.error('Please select a meal type for your pre-order')
        return
      }
    }

    setIsLoading(true)
    
    try {
      // Prepare order data for API submission
      const orderPayload = {
        orderType: orderDetails.orderType,
        items: cart.map(item => ({
          menuItemId: item.menuItemId, // Cart item.menuItemId corresponds to menuItem.id
          quantity: item.quantity,
          notes: ''
        })),
        
        // Guest customer information
        guestName: customerInfo.name,
        guestPhone: customerInfo.phone,
        guestEmail: customerInfo.email || undefined,
        guestAddress: orderDetails.orderType === 'DELIVERY' ? customerInfo.address : undefined,
        
        // Pre-order information
        isPreOrder: orderDetails.isPreOrder,
        scheduledDate: orderDetails.isPreOrder ? orderDetails.preOrderDate : undefined,
        scheduledTime: orderDetails.isPreOrder ? orderDetails.preOrderMealType?.toLowerCase() : undefined,
        
        // Order details
        tableNumber: orderDetails.orderType === 'DINE_IN' ? orderDetails.tableNumber : undefined,
        notes: customerInfo.specialInstructions || undefined
      }
      
      // Submit order to API
      const response = await fetch('/api/public/orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit order')
      }
      
      // Prepare order data for success page (using real order data from API)
      const orderData = {
        items: cart,
        customer: customerInfo,
        orderDetails: orderDetails,
        total: calculateTotal(),
        subtotal: calculateSubtotal(),
        deliveryFee: calculateDeliveryFee(),
        orderNumber: result.order.orderNumber,
        orderDate: new Date().toISOString(),
        orderId: result.order.id
      }
      
      // Store order data in sessionStorage for success page
      sessionStorage.setItem('lastOrderData', JSON.stringify(orderData))
      
      // Show success message
      toast.success('Order placed successfully!')
      
      // Clear cart after successful submission
      clearCart()
      
      // Redirect to success page
      window.location.href = '/public/order-success'
    } catch (error) {
      console.error('Order submission error:', error)
      
      // Provide specific error messages for different scenarios
      let errorMessage = 'Failed to place order. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('menu items are no longer available')) {
          errorMessage = 'Some items in your cart are no longer available. Please refresh and update your cart.'
        } else if (error.message.includes('before 11:59 PM') || error.message.includes('before 10:30 AM')) {
          errorMessage = error.message // Show specific pre-order time cutoff error
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/public/order">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            </div>

            {/* Empty Cart */}
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
                <p className="text-gray-600">Add some delicious items to get started</p>
                <Link href="/public/order">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Browse Menu
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/public/order">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <Badge variant="secondary" className="ml-auto">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items & Customer Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Order Items
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cart
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                      {/* Top row on mobile: Image + Details */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Item Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-2xl">🍽️</span>
                          )}
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          {item.category && (
                            <p className="text-sm text-gray-600 truncate">{item.category}</p>
                          )}
                          <p className="font-bold text-orange-600 text-sm sm:text-base">{formatCurrency(item.price)}</p>
                        </div>
                      </div>
                      
                      {/* Bottom row on mobile: Controls + Total + Remove */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-bold text-lg"
                          >
                            <Minus className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                          <span className="w-8 sm:w-12 text-center font-bold text-sm sm:text-lg">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 border-2 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 font-bold text-lg"
                          >
                            <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                        </div>
                        
                        {/* Item Total */}
                        <div className="text-right min-w-0">
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.menuItemId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="01XXXXXXXXX"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>
                  
                  {orderDetails.orderType === 'DELIVERY' && (
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Textarea
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Enter your complete delivery address"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={customerInfo.specialInstructions}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                      placeholder="Any special requests or dietary requirements"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Order Type</Label>
                    <Select 
                      value={orderDetails.orderType} 
                      onValueChange={(value) => 
                        setOrderDetails({...orderDetails, orderType: value as 'DELIVERY' | 'PICKUP' | 'DINE_IN'})
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DELIVERY">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Delivery
                          </div>
                        </SelectItem>
                        <SelectItem value="PICKUP">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Pickup
                          </div>
                        </SelectItem>
                        <SelectItem value="DINE_IN">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Dine In
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {orderDetails.orderType === 'DINE_IN' && (
                    <div>
                      <Label htmlFor="tableNumber">Table Number</Label>
                      <Input
                        id="tableNumber"
                        value={orderDetails.tableNumber || ''}
                        onChange={(e) => setOrderDetails({...orderDetails, tableNumber: e.target.value})}
                        placeholder="Enter table number"
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
                    <Input
                      id="scheduledTime"
                      type="datetime-local"
                      value={orderDetails.scheduledTime || ''}
                      onChange={(e) => setOrderDetails({...orderDetails, scheduledTime: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Payment Method</Label>
                    <Select 
                      value={orderDetails.paymentMethod} 
                      onValueChange={(value) => 
                        setOrderDetails({...orderDetails, paymentMethod: value as 'CASH' | 'CARD' | 'MOBILE'})
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash on Delivery</SelectItem>
                        <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                        <SelectItem value="MOBILE">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pre-order Options */}
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="preorder"
                        checked={orderDetails.isPreOrder}
                        onChange={(e) => setOrderDetails({...orderDetails, isPreOrder: e.target.checked})}
                        className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <Label htmlFor="preorder" className="text-lg font-semibold text-orange-900">
                        📅 Pre-order for tomorrow or later
                      </Label>
                    </div>
                    
                    {orderDetails.isPreOrder && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div>
                          <Label htmlFor="preOrderDate">Select Date *</Label>
                          <Input
                            id="preOrderDate"
                            type="date"
                            min={getMinimumDate()}
                            value={orderDetails.preOrderDate || ''}
                            onChange={(e) => setOrderDetails({...orderDetails, preOrderDate: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>Meal Type *</Label>
                          <Select 
                            value={orderDetails.preOrderMealType || ''} 
                            onValueChange={(value) => 
                              setOrderDetails({...orderDetails, preOrderMealType: value as 'BREAKFAST' | 'LUNCH' | 'DINNER'})
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select meal type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BREAKFAST">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span>🌅</span>
                                    Breakfast (7:00 AM - 11:00 AM)
                                  </div>
                                  <span className="text-xs text-gray-500">Order before 11:59 PM day before selected date</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="LUNCH">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span>☀️</span>
                                    Lunch (12:00 PM - 4:00 PM)
                                  </div>
                                  <span className="text-xs text-gray-500">Order before 10:30 AM on selected date</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="DINNER">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span>🌙</span>
                                    Dinner (6:00 PM - 11:00 PM)
                                  </div>
                                  <span className="text-xs text-gray-500">Order before 10:30 AM on selected date</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {orderDetails.preOrderMealType && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800 font-medium">
                              ℹ️ {getPreOrderMessage()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    
                    {orderDetails.orderType === 'DELIVERY' && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(calculateDeliveryFee())}</span>
                      </div>
                    )}
                    
                    <hr className="my-2" />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={handleSubmitOrder}
                      disabled={isLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                    
                    <div className="text-xs text-gray-600 text-center">
                      By placing this order, you agree to our terms and conditions
                    </div>
                  </div>
                  
                  {/* Estimated Time */}
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        Estimated {orderDetails.orderType === 'DELIVERY' ? 'Delivery' : 'Preparation'} Time: 25-35 mins
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}