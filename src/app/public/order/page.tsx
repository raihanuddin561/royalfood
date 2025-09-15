'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  image?: string | null
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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order page...</p>
      </div>
    </div>}>
      <OrderPageContent />
    </Suspense>
  )
}

function OrderPageContent() {
  const searchParams = useSearchParams()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DELIVERY')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch')
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

  // Helper functions for pre-order time restrictions
  const getCurrentTime = () => new Date()
  
  const canOrderBreakfast = (selectedDate: string) => {
    const now = getCurrentTime()
    const selected = new Date(selectedDate)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
    
    // Breakfast: Must order previous day before 11:59 PM
    if (selectedDay.getTime() === today.getTime()) {
      return false // Can't order breakfast for today
    }
    
    const previousDay = new Date(selectedDay)
    previousDay.setDate(previousDay.getDate() - 1)
    
    if (previousDay.getTime() === today.getTime()) {
      // Ordering for tomorrow's breakfast, check if it's before 11:59 PM today
      return now.getHours() < 24
    }
    
    return selectedDay > today // Future dates are allowed
  }
  
  const canOrderLunchOrDinner = (selectedDate: string) => {
    const now = getCurrentTime()
    const selected = new Date(selectedDate)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
    
    // Lunch/Dinner: Must order same day before 10 AM
    if (selectedDay.getTime() === today.getTime()) {
      return now.getHours() < 10
    }
    
    return selectedDay > today // Future dates are allowed
  }
  
  const isValidPreOrder = () => {
    if (!isPreOrder || !scheduledDate) return true
    
    if (mealType === 'breakfast') {
      return canOrderBreakfast(scheduledDate)
    } else {
      return canOrderLunchOrDinner(scheduledDate)
    }
  }
  
  const getPreOrderMessage = () => {
    if (!isPreOrder) return ''
    
    if (mealType === 'breakfast') {
      return 'Breakfast orders must be placed the day before by 11:59 PM'
    } else {
      return 'Lunch and dinner orders must be placed by 10:00 AM on the same day'
    }
  }

  // Fetch menu items
  useEffect(() => {
    fetchMenuItems()
  }, [])

  // Load cart from localStorage and handle reorder items
  useEffect(() => {
    // First, check for reorder items from session storage (higher priority)
    const reorderItems = sessionStorage.getItem('reorderItems')
    if (reorderItems) {
      try {
        const items = JSON.parse(reorderItems)
        setCart(items)
        sessionStorage.removeItem('reorderItems')
        toast.success('Previous order items loaded for reordering!')
        return // Exit early if reorder items exist
      } catch (error) {
        console.error('Error loading reorder items:', error)
        sessionStorage.removeItem('reorderItems')
      }
    }

    // If no reorder items, load cart from localStorage
    const savedCart = localStorage.getItem('royal-food-cart')
    if (savedCart) {
      try {
        const homePageCart = JSON.parse(savedCart)
        if (homePageCart.length > 0) {
          // Convert home page cart format to order page cart format
          const orderPageCart = homePageCart.map((item: any) => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          }))
          setCart(orderPageCart)
          console.log('Cart loaded from localStorage:', orderPageCart)
          toast.success(`Cart loaded with ${homePageCart.length} items!`)
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('royal-food-cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      // Convert order page cart format back to home page format for consistency
      const homePageCart = cart.map(item => ({
        id: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))
      localStorage.setItem('royal-food-cart', JSON.stringify(homePageCart))
    } else {
      // Clear localStorage if cart is empty
      localStorage.removeItem('royal-food-cart')
    }
  }, [cart])

  // Handle item parameter from URL (when clicking "Order Now" from home page)
  useEffect(() => {
    const itemId = searchParams.get('item')
    if (itemId && menuItems.length > 0) {
      const item = menuItems.find(menuItem => menuItem.id === itemId)
      if (item && item.isAvailable) {
        // Check if item is already in cart
        const existingItem = cart.find(cartItem => cartItem.menuItemId === itemId)
        if (!existingItem) {
          // Add item to cart
          const newCartItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image
          }
          setCart(prevCart => [...prevCart, newCartItem])
          toast.success(`${item.name} added to cart!`)
        }
      }
    }
  }, [searchParams, menuItems, cart])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/menu')
      const data = await response.json()
      
      if (data.success) {
        setMenuItems(data.menuItems || [])
        const uniqueCategories = ['all', ...Array.from(new Set((data.menuItems || []).map((item: MenuItem) => item.category)))] as string[]
        setCategories(uniqueCategories)
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to load menu items')
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

    // Validate pre-order restrictions
    if (isPreOrder) {
      if (!scheduledDate) {
        toast.error('Please select a date for your pre-order')
        return
      }
      
      if (!isValidPreOrder()) {
        toast.error(`Invalid time for ${mealType} order. ${getPreOrderMessage()}`)
        return
      }
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
        scheduledTime: isPreOrder ? mealType : undefined,
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
        
        // Clear cart and form data
        setCart([])
        setNotes('')
        setTableNumber('')
        setIsPreOrder(false)
        setScheduledDate('')
        setMealType('lunch')
        if (!currentCustomer) {
          setGuestInfo({ name: '', phone: '', email: '', address: '' })
        }
        
        // Redirect to success page
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-yellow-50/20">
        {/* Premium Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-green-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        </div>
        {/* Premium Header Section - Amazon/Alibaba Style */}
        <div className="bg-gradient-to-r from-white via-orange-50 to-white shadow-xl border-b-2 border-orange-200 sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                {/* Logo Section */}
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-2xl shadow-lg">
                    <ChefHat className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 bg-clip-text text-transparent">
                      Royal Food
                    </h1>
                    <p className="text-sm text-gray-600 font-medium">Premium Food Delivery Platform</p>
                  </div>
                </div>
                
                {/* Trust Badges */}
                <div className="hidden lg:flex items-center space-x-4">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold px-3 py-2 shadow-md">
                    <Star className="h-4 w-4 fill-current mr-2" />
                    4.9★ Rating
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-3 py-2 shadow-md">
                    <Zap className="h-4 w-4 mr-2" />
                    Express Delivery
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-3 py-2 shadow-md">
                    <Shield className="h-4 w-4 mr-2" />
                    100% Safe
                  </Badge>
                </div>
              </div>
              
              {/* Right Section */}
              <div className="flex items-center space-x-6">
                {/* Contact Info */}
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <span className="font-bold text-orange-700">15-30 min</span>
                      <p className="text-xs text-gray-600">Average Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-bold text-green-700">+880-1234-5678</span>
                      <p className="text-xs text-gray-600">24/7 Support</p>
                    </div>
                  </div>
                </div>
                
                {/* User Authentication */}
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                >
                  <User className="h-5 w-5 mr-2" />
                  {currentCustomer ? currentCustomer.name : 'Sign In / Register'}
                </Button>
              </div>
            </div>
            
            {/* Mobile Trust Badges */}
            <div className="lg:hidden pb-4">
              <div className="flex items-center justify-center space-x-3">
                <Badge className="bg-yellow-500 text-white text-xs font-bold">4.9★ 50K+</Badge>
                <Badge className="bg-green-500 text-white text-xs font-bold">Express</Badge>
                <Badge className="bg-blue-500 text-white text-xs font-bold">100% Safe</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            {/* Main Content - Menu Items */}
            <div className="lg:col-span-3">
              {/* Premium Search and Filters - Amazon Style */}
              <div className="bg-gradient-to-r from-white via-orange-50/50 to-white rounded-xl lg:rounded-3xl shadow-xl border-2 border-orange-200 p-4 lg:p-8 mb-6 lg:mb-10">
                {/* Main Search Bar */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-center mb-6 lg:mb-8">
                  <div className="flex-1 max-w-2xl">
                    <div className="relative">
                      <Search className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-orange-500 h-5 w-5 lg:h-6 lg:w-6" />
                      <Input
                        placeholder="Search for delicious food..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 lg:pl-16 h-12 lg:h-16 text-base lg:text-lg border-2 lg:border-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl lg:rounded-2xl bg-white shadow-lg font-medium"
                      />
                      <div className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-sm lg:text-base">
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter Controls */}
                  <div className="flex items-center space-x-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-56 h-16 border-3 border-gray-300 rounded-2xl bg-white shadow-lg text-lg font-medium">
                        <Filter className="h-5 w-5 mr-3 text-orange-500" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category} className="text-lg py-3">
                            {category === 'all' ? '🍽️ All Categories' : `🍴 ${category}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* View Mode Toggle */}
                    <div className="flex border-3 border-gray-300 rounded-2xl overflow-hidden bg-white shadow-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="lg"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-none h-16 px-6 ${viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600'}`}
                      >
                        <Grid className="h-5 w-5" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="lg"
                        onClick={() => setViewMode('list')}
                        className={`rounded-none h-16 px-6 ${viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600'}`}
                      >
                        <List className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Category Filters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Browse by Category</h3>
                  <div className="flex flex-wrap gap-4">
                    {categories.slice(0, 10).map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setSelectedCategory(category)}
                        className={`h-14 px-8 font-bold text-lg transition-all duration-300 rounded-2xl ${
                          selectedCategory === category 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl transform scale-105' 
                            : 'border-3 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 hover:scale-105'
                        }`}
                      >
                        {category === 'all' ? '🍽️ All Items' : `🍴 ${category}`}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Quick Filters */}
                <div className="mt-6 pt-6 border-t border-orange-200">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Quick Filters:</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-green-100 text-green-700 px-4 py-2 text-sm cursor-pointer hover:bg-green-200">
                      ⚡ Fast Delivery
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-sm cursor-pointer hover:bg-blue-200">
                      💰 Under BDT 500
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 px-4 py-2 text-sm cursor-pointer hover:bg-purple-200">
                      ⭐ Highly Rated
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 px-4 py-2 text-sm cursor-pointer hover:bg-red-200">
                      🔥 Trending
                    </Badge>
                  </div>
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

              {/* Menu Items Grid - Amazon/Alibaba Style */}
              {!loading && (
                <div className={`grid gap-4 md:gap-6 lg:gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredItems.map((item) => {
                    const cartQuantity = getCartQuantity(item.id)
                    
                    return (
                      <Card key={item.id} className={`group hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-orange-400 bg-white overflow-hidden hover:scale-[1.02] transform ${
                        viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
                      }`}>
                        {/* Product Image Section */}
                        <div className={`relative ${
                          viewMode === 'list' ? 'w-full sm:w-64 sm:flex-shrink-0 h-48 sm:h-auto' : 'aspect-[4/3]'
                        } overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100`}>
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
                              <ChefHat className="h-20 w-20 text-orange-400" />
                            </div>
                          )}
                          
                          {/* Premium Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1">
                              25% OFF
                            </Badge>
                            <Badge className="bg-green-600 text-white text-xs font-semibold px-2 py-1">
                              <Zap className="h-3 w-3 mr-1" />
                              Fast Delivery
                            </Badge>
                          </div>
                          
                          {/* Wishlist Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 h-10 w-10 p-0 rounded-full shadow-md"
                          >
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Product Details Section */}
                        <CardContent className={`p-6 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
                          <div className="space-y-4">
                            {/* Product Title & Rating */}
                            <div>
                              <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2 hover:text-orange-600 transition-colors cursor-pointer line-clamp-2">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-700">(4.8)</span>
                                <span className="text-sm text-gray-500">1,234 reviews</span>
                              </div>
                            </div>
                            
                            {/* Product Description */}
                            {item.description && (
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                {item.description}
                              </p>
                            )}
                            
                            {/* Features & Benefits */}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                <Shield className="h-3 w-3 mr-1" />
                                Fresh & Hygienic
                              </Badge>
                              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                                <Award className="h-3 w-3 mr-1" />
                                Chef's Special
                              </Badge>
                              {item.prepTime && (
                                <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {item.prepTime} min
                                </Badge>
                              )}
                            </div>
                            
                            {/* Price Section */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-3xl font-bold text-orange-600">
                                    {formatCurrency(item.price)}
                                  </span>
                                  <span className="text-lg text-gray-400 line-through">
                                    {formatCurrency(Math.round(item.price * 1.33))}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-green-600 font-medium">
                                  <Truck className="h-3 w-3" />
                                  <span>Free delivery on orders over BDT 500</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons - Amazon Style */}
                            <div className="pt-4 space-y-3">
                              {cartQuantity > 0 ? (
                                <div className="space-y-3">
                                  {/* Quantity Controls */}
                                  <div className="flex items-center justify-center space-x-4 bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQuantity(item.id, cartQuantity - 1)}
                                      className="h-10 w-10 p-0 border-orange-300 hover:bg-orange-100 text-orange-600"
                                    >
                                      <Minus className="h-5 w-5" />
                                    </Button>
                                    <span className="font-bold text-2xl text-orange-700 min-w-[60px] text-center">
                                      {cartQuantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQuantity(item.id, cartQuantity + 1)}
                                      className="h-10 w-10 p-0 border-orange-300 hover:bg-orange-100 text-orange-600"
                                    >
                                      <Plus className="h-5 w-5" />
                                    </Button>
                                  </div>
                                  
                                  {/* Remove from Cart */}
                                  <Button
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50 font-medium"
                                  >
                                    Remove from Cart
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Primary Add to Cart Button - Amazon Style */}
                                  <Button
                                    onClick={() => addToCart(item)}
                                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                                  >
                                    <ShoppingCart className="h-5 w-5 mr-3" />
                                    Add to Cart
                                  </Button>
                                  
                                  {/* Secondary Order Now Button - Alibaba Style */}
                                  <Button
                                    onClick={() => addToCart(item)}
                                    variant="outline"
                                    className="w-full h-12 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg"
                                  >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Order Now
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Trust Indicators */}
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-1">
                                <Shield className="h-3 w-3 text-green-500" />
                                <span>Secure Payment</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Truck className="h-3 w-3 text-blue-500" />
                                <span>Fast Shipping</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Award className="h-3 w-3 text-purple-500" />
                                <span>Quality Guaranteed</span>
                              </div>
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

              {/* Error State */}
              {!loading && menuItems.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-8">
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-medium text-red-900 mb-2">Something went wrong</h3>
                    <p className="text-red-700 mb-4">We're having trouble loading the menu. Please try refreshing the page.</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Cart & Order Details */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-24 space-y-4 lg:space-y-6">
                {/* Cart Summary */}
                <Card className="bg-gradient-to-br from-white to-orange-50/50 shadow-xl lg:shadow-2xl border-2 border-orange-100 backdrop-blur-sm">
                  <CardContent className="p-4 lg:p-8">
                    <div className="flex items-center justify-between mb-4 lg:mb-8">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900">🛒 Your Cart</h3>
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm px-2 lg:px-3 py-1">
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
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="font-medium text-sm text-gray-900 leading-tight truncate">{item.name}</h4>
                              <p className="text-orange-600 font-semibold text-sm">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="h-7 w-7 lg:h-6 lg:w-6 p-0 hover:bg-red-100 hover:text-red-600"
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
                            <Label htmlFor="preorder" className="text-sm text-gray-700">Schedule for later (Pre-order)</Label>
                          </div>

                          {isPreOrder && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-amber-800">Pre-order Information</span>
                                </div>
                                <p className="text-xs text-amber-700 mb-3">{getPreOrderMessage()}</p>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Meal Type</Label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { value: 'breakfast', label: 'Breakfast', time: '8-11 AM', restriction: 'Order by 11:59 PM previous day' },
                                      { value: 'lunch', label: 'Lunch', time: '12-3 PM', restriction: 'Order by 10 AM same day' },
                                      { value: 'dinner', label: 'Dinner', time: '6-10 PM', restriction: 'Order by 10 AM same day' }
                                    ].map(({ value, label, time, restriction }) => (
                                      <Button
                                        key={value}
                                        type="button"
                                        variant={mealType === value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setMealType(value as any)}
                                        className={`flex flex-col items-center p-3 h-auto text-xs ${
                                          mealType === value 
                                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                            : 'border-gray-200 hover:border-orange-300'
                                        }`}
                                        title={restriction}
                                      >
                                        <span className="font-medium">{label}</span>
                                        <span className="text-xs opacity-75">{time}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</Label>
                                  <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`text-sm border-gray-200 ${!isValidPreOrder() ? 'border-red-300 bg-red-50' : ''}`}
                                  />
                                  {!isValidPreOrder() && scheduledDate && (
                                    <p className="text-xs text-red-600 mt-1">
                                      This date is not available for {mealType} orders. {getPreOrderMessage()}
                                    </p>
                                  )}
                                </div>
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

                        {/* Order Type Information */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">i</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900 mb-2">Order Types Available</h4>
                              <div className="text-sm text-blue-800 space-y-1">
                                <p><strong>Regular Order:</strong> Immediate preparation and delivery</p>
                                <p><strong>Pre-order:</strong> Schedule for specific meal times with advance notice</p>
                              </div>
                            </div>
                          </div>
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

                {/* Premium Place Order Button - Amazon Style */}
                {cart.length > 0 && (
                  <div className="space-y-6">
                    <Button
                      onClick={handleSubmitOrder}
                      className="w-full h-20 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white text-2xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 border-0 rounded-3xl"
                      size="lg"
                    >
                      <ShoppingCart className="h-8 w-8 mr-4" />
                      🚀 Place Order Now • {formatCurrency(total)}
                      <ArrowRight className="h-8 w-8 ml-4" />
                    </Button>
                    
                    {/* Amazon-style guarantees */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 space-y-3">
                      <div className="flex items-center justify-center space-x-8 text-sm">
                        <div className="flex items-center space-x-2 text-green-700">
                          <Shield className="h-5 w-5" />
                          <span className="font-semibold">💯 Money Back Guarantee</span>
                        </div>
                        <div className="flex items-center space-x-2 text-blue-700">
                          <Truck className="h-5 w-5" />
                          <span className="font-semibold">⚡ Lightning Fast Delivery</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-700">
                          <Award className="h-5 w-5" />
                          <span className="font-semibold">🏆 Premium Quality</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 font-medium">Your order will be confirmed within 2 minutes • 24/7 Customer Support</p>
                      </div>
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