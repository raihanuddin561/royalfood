'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, ShoppingCart, User, MapPin, Clock, Calendar, LogIn, UserPlus } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import CustomerAuthModal from '@/components/auth/CustomerAuthModal'

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string
  prepTime?: number
  isAvailable: boolean
}

type CartItem = {
  menuItemId: string
  quantity: number
  name: string
  price: number
}

type CustomerInfo = {
  id?: string
  name: string
  phone: string
  email?: string
  address?: string
}

type OrderData = {
  items: { menuItemId: string; quantity: number }[]
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  customerId?: string
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestAddress?: string
  tableNumber?: string
  notes?: string
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
}

export default function PublicOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredCustomer, setRegisteredCustomer] = useState<CustomerInfo | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Load menu items
  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/menu/list')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data.items || [])
      } else {
        toast.error('Failed to load menu items')
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      toast.error('Failed to load menu')
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItemId === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prev, {
          menuItemId: item.id,
          quantity: 1,
          name: item.name,
          price: item.price
        }]
      }
    })
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId)
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      } else {
        return prev.filter(item => item.menuItemId !== menuItemId)
      }
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const validateForm = () => {
    // Check if we have customer info (either registered or guest)
    const hasCustomerInfo = registeredCustomer || (customerInfo.name.trim() && customerInfo.phone.trim())
    
    if (!hasCustomerInfo) {
      toast.error('Customer information is required')
      return false
    }
    
    // For guest customers, ensure required fields
    if (!registeredCustomer) {
      if (!customerInfo.name.trim()) {
        toast.error('Name is required')
        return false
      }
      if (!customerInfo.phone.trim()) {
        toast.error('Phone number is required')
        return false
      }
    }
    
    // Check delivery address
    if (orderType === 'DELIVERY') {
      const hasAddress = registeredCustomer?.address || customerInfo.address?.trim()
      if (!hasAddress) {
        toast.error('Address is required for delivery orders')
        return false
      }
    }
    
    if (cart.length === 0) {
      toast.error('Please add items to your cart')
      return false
    }
    if (isPreOrder && !scheduledDate) {
      toast.error('Please select a date for pre-order')
      return false
    }
    if (isPreOrder && scheduledDate) {
      const selectedDate = new Date(scheduledDate)
      if (selectedDate <= new Date()) {
        toast.error('Scheduled date must be in the future')
        return false
      }
    }
    return true
  }

  const submitOrder = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const orderData: OrderData = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        })),
        orderType,
        // Use registered customer ID if available, otherwise guest info
        customerId: registeredCustomer?.id,
        guestName: registeredCustomer ? undefined : customerInfo.name,
        guestPhone: registeredCustomer ? undefined : customerInfo.phone,
        guestEmail: registeredCustomer ? undefined : (customerInfo.email || undefined),
        guestAddress: orderType === 'DELIVERY' ? (registeredCustomer?.address || customerInfo.address) : undefined,
        tableNumber: orderType === 'DINE_IN' ? tableNumber || undefined : undefined,
        notes: notes || undefined,
        isPreOrder,
        scheduledDate: isPreOrder ? scheduledDate : undefined,
        scheduledTime: isPreOrder ? scheduledTime : undefined
      }

      const response = await fetch('/api/public/orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Order submitted successfully!')
        // Reset form
        setCart([])
        if (!registeredCustomer) {
          setCustomerInfo({ name: '', phone: '', email: '', address: '' })
        }
        setNotes('')
        setIsPreOrder(false)
        setScheduledDate('')
        setScheduledTime('')
        setTableNumber('')
        
        // Optionally redirect to order confirmation page
        // router.push(`/public/order/confirmation/${result.order.id}`)
      } else {
        toast.error(result.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to submit order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedItems = menuItems.reduce((groups, item) => {
    const category = item.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, MenuItem[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Royal Food
            </h1>
          </div>
          <p className="text-lg text-gray-600">Place your order online with ease</p>
          <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Fresh & Fast
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Delivery Available
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-xl text-orange-600">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white group hover:border-blue-200">
                          {/* Item Image */}
                          <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-gray-400 text-2xl">🍽️</span>
                              </div>
                            )}
                            {/* Availability indicator */}
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="bg-red-500 text-white">
                                  Out of Stock
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  ₹{item.price}
                                </span>
                                {item.prepTime && (
                                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {item.prepTime}min
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {cart.find(cartItem => cartItem.menuItemId === item.id) ? (
                                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {cart.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addToCart(item)}
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  disabled={!item.isAvailable}
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Cart */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Your Order ({cart.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length > 0 ? (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.menuItemId} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.menuItemId)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
                                if (menuItem) addToCart(menuItem)
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center font-bold text-lg bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg">
                          <span>Total:</span>
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{getCartTotal()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Your cart is empty</p>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Authentication Options */}
                  {!registeredCustomer && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <p className="text-sm text-gray-700 mb-3">
                        Already have an account? Login for faster checkout and order history.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAuthModal(true)}
                          className="flex-1"
                        >
                          <LogIn className="w-4 h-4 mr-1" />
                          Login
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAuthModal(true)}
                          className="flex-1"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Register
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Registered Customer Info */}
                  {registeredCustomer && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">{registeredCustomer.name}</p>
                          <p className="text-sm text-green-600">{registeredCustomer.email}</p>
                          <p className="text-sm text-green-600">{registeredCustomer.phone}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRegisteredCustomer(null)}
                          className="text-green-700 hover:bg-green-100"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Guest Customer Form */}
                  {!registeredCustomer && (
                    <>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Order Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Order Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={orderType} onValueChange={(value) => setOrderType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                      <SelectItem value="DINE_IN">Dine In</SelectItem>
                      <SelectItem value="DELIVERY">Delivery</SelectItem>
                    </SelectContent>
                  </Select>

                  {orderType === 'DINE_IN' && (
                    <div>
                      <Label htmlFor="table">Table Number (Optional)</Label>
                      <Input
                        id="table"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Enter table number"
                      />
                    </div>
                  )}

                  {orderType === 'DELIVERY' && (
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      {registeredCustomer?.address ? (
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-sm text-gray-700">{registeredCustomer.address}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Allow editing address for registered customers
                              setCustomerInfo(prev => ({ ...prev, address: registeredCustomer.address || '' }))
                            }}
                            className="mt-2 text-blue-600 hover:bg-blue-50"
                          >
                            Use Different Address
                          </Button>
                        </div>
                      ) : (
                        <Textarea
                          id="address"
                          value={customerInfo.address}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your full address"
                          rows={3}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pre-order Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Pre-order Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="preorder"
                      checked={isPreOrder}
                      onChange={(e) => setIsPreOrder(e.target.checked)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <Label htmlFor="preorder">This is a pre-order</Label>
                  </div>

                  {isPreOrder && (
                    <>
                      <div>
                        <Label htmlFor="date">Scheduled Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={getTomorrowDate()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Preferred Time</Label>
                        <Select value={scheduledTime} onValueChange={setScheduledTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast (8:00 AM - 11:00 AM)</SelectItem>
                            <SelectItem value="lunch">Lunch (12:00 PM - 3:00 PM)</SelectItem>
                            <SelectItem value="dinner">Dinner (7:00 PM - 10:00 PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="Any special instructions or preferences..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Submit Order */}
              <Button
                onClick={submitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold py-3 text-lg"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  `Place Order (₹${getCartTotal()})`
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Authentication Modal */}
        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(customer) => {
            setRegisteredCustomer(customer)
            setShowAuthModal(false)
          }}
        />
      </div>
    </div>
  )
}
