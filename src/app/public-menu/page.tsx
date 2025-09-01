'use client'

import React, { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Clock, 
  MapPin,
  Phone,
  User,
  Check,
  X
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotification } from '@/components/ui/Notification'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string | null
  prepTime: number | null
}

interface Category {
  id: string
  name: string
  description: string | null
  items: MenuItem[]
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
}

export default function PublicMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { showNotification } = useNotification()

  // Load menu items
  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      const response = await fetch('/api/public/menu')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      } else {
        showNotification('error', 'Failed to load menu items')
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      showNotification('error', 'Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  // Cart functions
  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItem.id)
      if (existing) {
        return prev.map(item => 
          item.menuItemId === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }]
    })
    showNotification('success', `${menuItem.name} added to cart`)
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
      }
      return prev.filter(item => item.menuItemId !== menuItemId)
    })
  }

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    const tax = subtotal * 0.05 // 5% tax
    const delivery = orderType === 'DELIVERY' ? 50 : 0
    return {
      subtotal,
      tax,
      delivery,
      total: subtotal + tax + delivery
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      showNotification('error', 'Your cart is empty')
      return
    }
    setShowCart(false)
    setShowCheckout(true)
  }

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      showNotification('error', 'Please provide your name and phone number')
      return
    }

    if (orderType === 'DELIVERY' && !customerInfo.address) {
      showNotification('error', 'Please provide delivery address')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/public/orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderType,
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes
          })),
          guestName: customerInfo.name,
          guestPhone: customerInfo.phone,
          guestEmail: customerInfo.email || undefined,
          guestAddress: orderType === 'DELIVERY' ? customerInfo.address : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        showNotification('success', `Order #${data.order.orderNumber} submitted successfully!`)
        setCart([])
        setShowCheckout(false)
        setCustomerInfo({ name: '', phone: '', email: '', address: '' })
      } else {
        showNotification('error', data.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      showNotification('error', 'Failed to submit order')
    } finally {
      setSubmitting(false)
    }
  }

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const totals = getCartTotal()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Royal Food</h1>
              <p className="text-sm text-gray-600">Delicious food delivered to your door</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Order Type Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Order Type</h3>
          <div className="flex space-x-4">
            {[
              { value: 'TAKEAWAY', label: 'Takeaway', icon: '🥡' },
              { value: 'DELIVERY', label: 'Delivery', icon: '🚚' },
              { value: 'DINE_IN', label: 'Dine In', icon: '🍽️' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setOrderType(type.value as typeof orderType)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  orderType === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h2>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => {
                  const cartItem = cart.find(c => c.menuItemId === item.id)
                  const quantity = cartItem?.quantity || 0
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Item Image */}
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-gray-400 text-sm">No Image</span>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</span>
                            {item.prepTime && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                {item.prepTime} min
                              </div>
                            )}
                          </div>
                          
                          {/* Add to Cart Controls */}
                          <div className="flex items-center space-x-2">
                            {quantity > 0 ? (
                              <>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-semibold">{quantity}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Order</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{formatCurrency(item.price)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => addToCart({ id: item.menuItemId, name: item.name, price: item.price } as MenuItem)}
                          className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  {totals.delivery > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(totals.delivery)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Customer Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                {orderType === 'DELIVERY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>
                )}
              </div>
              
              {/* Order Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between">
                      <span>{item.quantity}× {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  {totals.delivery > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(totals.delivery)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Cash on Delivery</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Pay when you receive your order
                </p>
              </div>
              
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Menu State */}
      {categories.length === 0 && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium mb-2">Menu Coming Soon</h3>
            <p>We're working on adding delicious items to our menu. Please check back later!</p>
          </div>
        </div>
      )}
    </div>
  )
}
