'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Star, 
  Heart, 
  Clock, 
  Truck, 
  Store, 
  MapPin, 
  User, 
  ChefHat,
  Search,
  Filter,
  Grid,
  List,
  ArrowRight,
  Shield,
  Award,
  Zap,
  Phone,
  Mail,
  Calendar,
  Timer
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import CustomerAuthModal from '@/components/auth/CustomerAuthModal'
import { formatCurrency } from '@/lib/currency-config'
import Head from 'next/head'

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

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<CustomerInfo | null>(null)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  // Calculate totals with correct currency
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = orderType === 'DELIVERY' ? 50 : 0
  const total = subtotal + deliveryFee

  // Fetch menu items
  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/menu')
      const data = await response.json()
      
      if (data.success) {
        setMenuItems(data.menuItems)
        const uniqueCategories = ['all', ...Array.from(new Set(data.menuItems.map((item: MenuItem) => item.category)))] as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && item.isAvailable
  })

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItemId === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, {
        menuItemId: item.id,
        quantity: 1,
        name: item.name,
        price: item.price
      }]
    })
    toast.success(`${item.name} added to cart`)
  }

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId))
    const itemName = cart.find(item => item.menuItemId === menuItemId)?.name
    toast.success(`${itemName} removed from cart`)
  }

  const getCartQuantity = (menuItemId: string) => {
    return cart.find(item => item.menuItemId === menuItemId)?.quantity || 0
  }

  const handleCustomerAuth = (customer: CustomerInfo) => {
    setCurrentCustomer(customer)
    setShowAuthModal(false)
    toast.success(`Welcome back, ${customer.name}!`)
  }

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to your cart')
      return
    }

    if (!currentCustomer && (!guestInfo.name || !guestInfo.phone)) {
      toast.error('Please provide customer information')
      return
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      toast.error('Please provide table number')
      return
    }

    try {
      const orderData: OrderData = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        })),
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        notes,
        isPreOrder,
        scheduledDate: isPreOrder && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        scheduledTime: isPreOrder ? scheduledTime : undefined,
        ...(currentCustomer ? {
          customerId: currentCustomer.id
        } : {
          guestName: guestInfo.name,
          guestPhone: guestInfo.phone,
          guestEmail: guestInfo.email || undefined,
          guestAddress: guestInfo.address || undefined
        })
      }

      const response = await fetch('/api/public/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Order placed successfully! Order #${result.order.orderNumber}`)
        setCart([])
        setNotes('')
        setTableNumber('')
        setIsPreOrder(false)
        setScheduledDate('')
        setScheduledTime('')
        if (!currentCustomer) {
          setGuestInfo({ name: '', phone: '', email: '', address: '' })
        }
      } else {
        toast.error(result.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to place order')
    }
  }

  return (
    <>
      <Head>
        <title>Order Online - Royal Food | Fresh, Delicious Meals Delivered</title>
        <meta name="description" content="Order fresh, delicious meals from Royal Food. Browse our extensive menu, customize your order, and enjoy fast delivery or pickup. Quality ingredients, authentic flavors." />
        <meta name="keywords" content="food delivery, online ordering, restaurant, Royal Food, fresh meals, delivery, takeaway" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Order Online - Royal Food" />
        <meta property="og:description" content="Order fresh, delicious meals from Royal Food. Browse our extensive menu and enjoy fast delivery." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/public/order" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-yellow-50/30">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        </div>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-white via-orange-50 to-white shadow-lg border-b-2 border-orange-100 sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Royal Food</h1>
                    <p className="text-sm text-gray-600">Premium Food Delivery</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold">
                    <Star className="h-3 w-3 text-white fill-current mr-1" />
                    4.9 Rating • 50K+ Orders
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                    <Zap className="h-3 w-3 mr-1" />
                    Express Delivery
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">15-30 min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-medium">+880-XXX-XXXX</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="hidden sm:flex border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold"
                >
                  <User className="h-4 w-4 mr-2" />
                  {currentCustomer ? currentCustomer.name : 'Sign In'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Menu Items */}
            <div className="lg:col-span-3">
              {/* Search and Filters */}
              <div className="bg-gradient-to-r from-white to-orange-50 rounded-2xl shadow-lg border-2 border-orange-100 p-8 mb-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 h-5 w-5" />
                      <Input
                        placeholder="Search for delicious food, cuisines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-lg rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 h-12 border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm">
                        <Filter className="h-4 w-4 mr-2 text-orange-500" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? '🍽️ All Categories' : `🍴 ${category}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-none h-12 px-4 ${viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`rounded-none h-12 px-4 ${viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Category Pills */}
                <div className="flex flex-wrap gap-3">
                  {categories.slice(0, 8).map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`h-10 px-6 font-semibold transition-all duration-200 rounded-full ${
                        selectedCategory === category 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg' 
                          : 'border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                      }`}
                    >
                      {category === 'all' ? '🍽️ All Items' : `🍴 ${category}`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Menu Items Grid */}
              {!loading && (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredItems.map((item) => {
                    const cartQuantity = getCartQuantity(item.id)
                    
                    return (
                      <Card key={item.id} className={`group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-orange-300 bg-white overflow-hidden hover:scale-[1.03] transform ${
                        viewMode === 'list' ? 'flex flex-row' : ''
                      }`}>
                        <div className={`relative ${
                          viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'
                        } overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50`}>
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-100">
                              <ChefHat className="h-16 w-16 text-orange-400" />
                            </div>
                          )}
                          
                          {/* Premium Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold shadow-lg">
                              <Zap className="h-3 w-3 mr-1" />
                              Fast Delivery
                            </Badge>
                            {item.prepTime && (
                              <Badge className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs shadow-md border border-gray-200">
                                <Clock className="h-3 w-3 mr-1" />
                                {item.prepTime} min
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 h-9 w-9 p-0 shadow-md"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>

                          {/* Discount Badge */}
                          <div className="absolute bottom-3 right-3">
                            <Badge className="bg-red-500 text-white text-xs font-bold">
                              20% OFF
                            </Badge>
                          </div>
                        </div>
                        
                        <CardContent className={`p-6 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <h3 className="font-bold text-xl text-gray-900 leading-tight hover:text-orange-600 transition-colors cursor-pointer">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-1 ml-2 bg-yellow-50 px-2 py-1 rounded-full">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-semibold text-yellow-700">4.8</span>
                                <span className="text-xs text-gray-500">(124)</span>
                              </div>
                            </div>
                            
                            {item.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            
                            {/* Features */}
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1 text-green-600">
                                <Shield className="h-3 w-3" />
                                <span>Fresh & Hygienic</span>
                              </div>
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Award className="h-3 w-3" />
                                <span>Chef's Special</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="space-y-1">
                                <div className="flex items-baseline space-x-2">
                                  <div className="text-3xl font-bold text-orange-600">
                                    {formatCurrency(item.price)}
                                  </div>
                                  <div className="text-lg text-gray-400 line-through">
                                    {formatCurrency(item.price * 1.2)}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Truck className="h-3 w-3" />
                                  <span>Free Delivery on orders above BDT 500</span>
                                </div>
                              </div>
                              
                              {cartQuantity > 0 ? (
                                <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-1 border border-orange-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, cartQuantity - 1)}
                                    className="h-8 w-8 p-0 hover:bg-orange-100 text-orange-600"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-bold text-orange-700 min-w-[32px] text-center bg-white rounded px-2">
                                    {cartQuantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, cartQuantity + 1)}
                                    className="h-8 w-8 p-0 hover:bg-orange-100 text-orange-600"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToCart(item)}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Order Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredItems.length === 0 && (
                <div className="text-center py-16">
                  <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>

            {/* Sidebar - Cart & Order Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Cart Summary */}
                <Card className="bg-gradient-to-br from-white to-orange-50/50 shadow-2xl border-2 border-orange-100 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold text-gray-900">🛒 Your Cart</h3>
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm px-3 py-1">
                        {cart.length} items
                      </Badge>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Your cart is empty</p>
                          <p className="text-gray-400 text-xs">Add delicious items to get started</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.menuItemId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900 leading-tight">{item.name}</h4>
                              <p className="text-orange-600 font-semibold text-sm">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium text-sm w-8 text-center bg-orange-50 rounded px-1">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Order Type Selection */}
                    {cart.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Order Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'DINE_IN', icon: Store, label: 'Dine In' },
                            { value: 'TAKEAWAY', icon: ShoppingCart, label: 'Takeaway' },
                            { value: 'DELIVERY', icon: Truck, label: 'Delivery' }
                          ].map(({ value, icon: Icon, label }) => (
                            <Button
                              key={value}
                              variant={orderType === value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOrderType(value as any)}
                              className={`flex flex-col items-center p-3 h-auto ${
                                orderType === value 
                                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <Icon className="h-4 w-4 mb-1" />
                              <span className="text-xs">{label}</span>
                            </Button>
                          ))}
                        </div>

                        {/* Table Number for Dine In */}
                        {orderType === 'DINE_IN' && (
                          <div className="mt-4">
                            <Label htmlFor="tableNumber" className="text-sm font-medium text-gray-700">Table Number</Label>
                            <Input
                              id="tableNumber"
                              value={tableNumber}
                              onChange={(e) => setTableNumber(e.target.value)}
                              placeholder="Enter table number"
                              className="mt-1 border-gray-200 focus:border-orange-500"
                            />
                          </div>
                        )}

                        {/* Pre-order Options */}
                        <div className="mt-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="preorder"
                              checked={isPreOrder}
                              onChange={(e) => setIsPreOrder(e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <Label htmlFor="preorder" className="text-sm text-gray-700">Schedule for later</Label>
                          </div>

                          {isPreOrder && (
                            <div className="mt-3 space-y-3">
                              <div>
                                <Label className="text-xs text-gray-600">Date</Label>
                                <Input
                                  type="date"
                                  value={scheduledDate}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="mt-1 text-sm border-gray-200"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Time</Label>
                                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                                  <SelectTrigger className="mt-1 text-sm border-gray-200">
                                    <SelectValue placeholder="Select time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="breakfast">Breakfast (8-11 AM)</SelectItem>
                                    <SelectItem value="lunch">Lunch (12-3 PM)</SelectItem>
                                    <SelectItem value="dinner">Dinner (6-10 PM)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Notes */}
                        <div className="mt-4">
                          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Special Instructions</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any special requests or dietary requirements..."
                            className="mt-1 text-sm border-gray-200 focus:border-orange-500"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    {cart.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        {orderType === 'DELIVERY' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                          <span>Total</span>
                          <span className="text-orange-600">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                {cart.length > 0 && (
                  <Card className="bg-white shadow-lg border-orange-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                      
                      {currentCustomer ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <User className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{currentCustomer.name}</p>
                              <p className="text-sm text-green-700">{currentCustomer.phone}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentCustomer(null)}
                            className="w-full border-gray-200"
                          >
                            Use Different Customer
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowAuthModal(true)}
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Sign In / Register
                          </Button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-white px-2 text-gray-500">or continue as guest</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="guestName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                              <Input
                                id="guestName"
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter your name"
                                className="mt-1 border-gray-200 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="guestPhone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
                              <Input
                                id="guestPhone"
                                value={guestInfo.phone}
                                onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                                className="mt-1 border-gray-200 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="guestEmail" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                              <Input
                                id="guestEmail"
                                type="email"
                                value={guestInfo.email}
                                onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Enter email address"
                                className="mt-1 border-gray-200 focus:border-orange-500"
                              />
                            </div>
                            {orderType === 'DELIVERY' && (
                              <div>
                                <Label htmlFor="guestAddress" className="text-sm font-medium text-gray-700">Delivery Address</Label>
                                <Textarea
                                  id="guestAddress"
                                  value={guestInfo.address}
                                  onChange={(e) => setGuestInfo(prev => ({ ...prev, address: e.target.value }))}
                                  placeholder="Enter full delivery address"
                                  className="mt-1 border-gray-200 focus:border-orange-500"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Place Order Button */}
                {cart.length > 0 && (
                  <div className="space-y-4">
                    <Button
                      onClick={handleSubmitOrder}
                      className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 border-0 rounded-2xl"
                      size="lg"
                    >
                      <ShoppingCart className="h-6 w-6 mr-4" />
                      🚀 Place Order Now ({formatCurrency(total)})
                      <ArrowRight className="h-6 w-6 ml-4" />
                    </Button>
                    
                    {/* Additional Info */}
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">💯 100% Money Back Guarantee</p>
                      <p className="text-xs text-gray-500">Your order will be confirmed within 2 minutes</p>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Safe & Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span>Quality Food</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Auth Modal */}
        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleCustomerAuth}
        />
      </div>
    </>
  )
}