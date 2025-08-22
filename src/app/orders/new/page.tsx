'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Minus, ShoppingCart, Users, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useNotification, Notification } from '@/components/ui/Notification'

interface MenuItem {
  id: string
  name: string
  price: number
  description?: string
  category: {
    name: string
  }
  isAvailable: boolean
  prepTime?: number
}

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  unitPrice: number
  quantity: number
  totalPrice: number
  notes?: string
}

// Mock menu items - In a real app, this would come from an API
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Chicken Biriyani',
    price: 250,
    description: 'Aromatic basmati rice with tender chicken pieces',
    category: { name: 'Main Course' },
    isAvailable: true,
    prepTime: 25
  },
  {
    id: '2',
    name: 'Beef Curry',
    price: 280,
    description: 'Spicy beef curry with traditional spices',
    category: { name: 'Main Course' },
    isAvailable: true,
    prepTime: 30
  },
  {
    id: '3',
    name: 'Fish Fry',
    price: 200,
    description: 'Fresh fish marinated and fried to perfection',
    category: { name: 'Main Course' },
    isAvailable: true,
    prepTime: 15
  },
  {
    id: '4',
    name: 'Mango Lassi',
    price: 80,
    description: 'Refreshing yogurt drink with mango',
    category: { name: 'Beverages' },
    isAvailable: true,
    prepTime: 5
  },
  {
    id: '5',
    name: 'Samosa',
    price: 30,
    description: 'Crispy pastry filled with spiced vegetables',
    category: { name: 'Appetizers' },
    isAvailable: true,
    prepTime: 10
  }
]

export default function NewOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [orderType, setOrderType] = useState('DINE_IN')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { showNotification, notification, clearNotification } = useNotification()

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category.name === selectedCategory
    const isAvailable = item.isAvailable
    return matchesSearch && matchesCategory && isAvailable
  })

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category.name)))]

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxRate = 0.05 // 5% tax
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  // Add item to order
  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id)
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setOrderItems([...orderItems, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        unitPrice: menuItem.price,
        quantity: 1,
        totalPrice: menuItem.price
      }])
    }
  }

  // Update item quantity
  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId))
    } else {
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price }
          : item
      ))
    }
  }

  // Remove item from order
  const removeFromOrder = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId))
  }

  // Submit order
  const submitOrder = async () => {
    if (orderItems.length === 0) {
      showNotification('error', 'Please add at least one item to the order.', 'Invalid Order')
      return
    }

    if (!orderType) {
      showNotification('error', 'Please select an order type.', 'Invalid Order')
      return
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      showNotification('error', 'Please specify a table number for dine-in orders.', 'Invalid Order')
      return
    }

    if (orderType !== 'DINE_IN' && !customerName) {
      showNotification('error', 'Please provide customer name for takeaway/delivery orders.', 'Invalid Order')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        userId: 'current-user-id', // TODO: Get from session/auth
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
        customerName: orderType !== 'DINE_IN' ? customerName : null,
        customerPhone: orderType !== 'DINE_IN' ? customerPhone : null,
        totalAmount: subtotal,
        taxAmount,
        finalAmount: total,
        notes,
        orderItems: orderItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: null
        }))
      }
      
      console.log('Submitting order:', orderData)
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const result = await response.json()
      
      showNotification('success', `Order #${result.orderNumber} created successfully! The order has been sent to the kitchen.`, 'Order Confirmed')
      
      // Reset form after successful submission
      setOrderItems([])
      setOrderType('')
      setTableNumber('')
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
      
      // Optionally redirect to orders page
      setTimeout(() => {
        window.location.href = '/orders'
      }, 2000)
      
    } catch (error) {
      console.error('Error creating order:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to create order. Please try again.', 'Order Creation Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/orders"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Order</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new order for your customer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Type Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Type</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'DINE_IN', label: 'Dine In', icon: Users },
                { value: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingCart },
                { value: 'DELIVERY', label: 'Delivery', icon: MapPin }
              ].map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setOrderType(type.value)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                      orderType === type.value
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    } border`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </button>
                )
              })}
            </div>

            {/* Additional Fields Based on Order Type */}
            {orderType === 'DINE_IN' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {(orderType === 'TAKEAWAY' || orderType === 'DELIVERY') && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Menu Search and Filter */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </span>
                        {item.prepTime && (
                          <span className="text-xs text-gray-500">
                            {item.prepTime} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addToOrder(item)}
                    className="w-full mt-3 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Order
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="space-y-6">
          {/* Current Order */}
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Current Order ({orderItems.length} items)
            </h3>

            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">No items added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Totals */}
            {orderItems.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%):</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={submitOrder}
              disabled={orderItems.length === 0}
              className={`w-full mt-6 px-4 py-3 rounded-md font-medium flex items-center justify-center ${
                orderItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Place Order • {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={clearNotification}
        />
      )}
    </div>
  )
}
