'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getContactPhone, getOrderSettings } from '@/lib/restaurant-config'
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
import { CartIcon } from '@/components/ui/cart-icon'
import MenuItemCard from '@/components/ui/MenuItemCard'
import Head from 'next/head'

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string
  mealTypes?: string[]
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
  const orderType = 'DELIVERY' // Static delivery option as requested
  const [notes, setNotes] = useState('')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch')
  
  // Get restaurant settings
  const orderSettings = getOrderSettings()
  const preorderEnabled = orderSettings.preorderEnabled
  
  // Reset preorder state if preorders are disabled
  useEffect(() => {
    if (!preorderEnabled && isPreOrder) {
      setIsPreOrder(false)
    }
  }, [preorderEnabled, isPreOrder])
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
  // TODO: Delivery fee should come from admin settings, not be hardcoded
  const deliveryFee = 0 // orderType === 'DELIVERY' ? 50 : 0
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
    console.log('📦 Cart loading effect triggered')
    
    // First, check for reorder items from session storage (higher priority)
    const reorderItems = sessionStorage.getItem('reorderItems')
    if (reorderItems) {
      try {
        const items = JSON.parse(reorderItems)
        console.log('📦 Loading reorder items:', items)
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
    console.log('📦 Raw localStorage cart:', savedCart)
    
    if (savedCart) {
      try {
        const storedCart = JSON.parse(savedCart)
        console.log('📦 Parsed stored cart:', storedCart)
        
        if (storedCart.length > 0) {
          // Handle STANDARDIZED format - works with both id and menuItemId
          const orderPageCart = storedCart.map((item: any) => ({
            menuItemId: item.menuItemId || item.id, // Support both formats
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          }))
          console.log('📦 Converted order page cart:', orderPageCart)
          setCart(orderPageCart)
          console.log('📦 Cart loaded from localStorage:', orderPageCart)
          toast.success(`Cart loaded with ${storedCart.length} items!`)
        } else {
          console.log('📦 Empty cart in localStorage')
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('royal-food-cart')
      }
    } else {
      console.log('📦 No cart found in localStorage')
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
      if (item) {
        if (!item.isAvailable) {
          toast.error(`${item.name} is currently unavailable`)
          return
        }
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
  }, [searchParams, menuItems]) // Removed cart from dependencies to prevent reload loops

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    // Always save cart state, even if empty
    if (cart.length > 0) {
      // Save in STANDARDIZED format that ALL pages can understand
      const standardizedCart = cart.map(item => ({
        id: item.menuItemId,           // Primary ID field (for home page compatibility)
        menuItemId: item.menuItemId,   // Backup ID field (for order page compatibility)
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null
      }))
      localStorage.setItem('royal-food-cart', JSON.stringify(standardizedCart))
      console.log('💾 Cart saved to localStorage (standardized format):', standardizedCart)
    } else {
      // If cart is empty, remove from localStorage
      localStorage.removeItem('royal-food-cart')
      console.log('💾 Empty cart - removed from localStorage')
    }
  }, [cart])

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

  // Filter menu items - now includes unavailable items to show availability status
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMealType = mealType === 'breakfast' ? (item.mealTypes?.includes('BREAKFAST') ?? false) :
                           mealType === 'lunch' ? (item.mealTypes?.includes('LUNCH') ?? false) :
                           mealType === 'dinner' ? (item.mealTypes?.includes('DINNER') ?? false) : true
    return matchesCategory && matchesSearch && matchesMealType
  })

  // Cart functions
  const addToCart = (item: MenuItem) => {
    // Check if item is available before adding to cart
    if (!item.isAvailable) {
      toast.error(`${item.name} is currently unavailable`)
      return
    }

    // Check if item is compatible with selected meal type
    const selectedMealTypeUpper = mealType.toUpperCase()
    if (!(item.mealTypes?.includes(selectedMealTypeUpper as any) ?? false)) {
      toast.error(`${item.name} is not available for ${mealType}. Please select a different meal type or choose another item.`)
      return
    }

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
    console.log('🗑️ removeFromCart called for:', menuItemId)
    console.log('🗑️ Current cart before removal:', cart)
    
    const itemToRemove = cart.find(item => item.menuItemId === menuItemId)
    if (itemToRemove) {
      console.log('🗑️ Item found, removing:', itemToRemove)
      setCart(prev => {
        const newCart = prev.filter(item => item.menuItemId !== menuItemId)
        console.log('🗑️ New cart after removal:', newCart)
        return newCart
      })
      toast.success(`${itemToRemove.name} removed from cart`)
    } else {
      console.log('🗑️ Item not found in cart:', menuItemId)
    }
  }

  const getCartQuantity = (menuItemId: string) => {
    return cart.find(item => item.menuItemId === menuItemId)?.quantity || 0
  }

  // Adapter functions for MenuItemCard component compatibility
  const addToCartById = (itemId: string) => {
    const menuItem = menuItems.find(item => item.id === itemId)
    if (menuItem) {
      addToCart(menuItem)
    }
  }

  const updateQuantityById = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity)
  }

  const removeFromCartById = (itemId: string) => {
    removeFromCart(itemId)
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



    // Validate meal type compatibility
    const selectedMealTypeUpper = mealType.toUpperCase()
    const incompatibleItems = cart.filter(cartItem => {
      const menuItem = menuItems.find(m => m.id === cartItem.menuItemId)
      return menuItem && !(menuItem.mealTypes?.includes(selectedMealTypeUpper as any) ?? false)
    })

    if (incompatibleItems.length > 0) {
      const itemNames = incompatibleItems.map(item => item.name).join(', ')
      toast.error(`The following items are not available for ${mealType}: ${itemNames}. Please remove them from your cart or change the meal type.`)
      return
    }

    // Validate pre-order restrictions
    if (isPreOrder) {
      if (!preorderEnabled) {
        toast.error('Pre-orders are currently disabled')
        return
      }
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
              <div className="flex items-center space-x-3 sm:space-x-6">
                {/* Logo Section */}
                <Link href="/" className="flex items-center space-x-2 sm:space-x-4 group cursor-pointer">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:via-red-600 group-hover:to-orange-800 transition-all duration-300">
                      Royal Food
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block group-hover:text-gray-800 transition-colors duration-300">Premium Food Delivery Platform</p>
                  </div>
                </Link>
                
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
                      <a href={`tel:${getContactPhone()}`} className="font-bold text-green-700 hover:text-green-800 transition-colors">{getContactPhone()}</a>
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
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Badge className="bg-yellow-500 text-white text-xs font-bold">4.9★ 50K+</Badge>
                <Badge className="bg-green-500 text-white text-xs font-bold">Express</Badge>
                <Badge className="bg-blue-500 text-white text-xs font-bold">100% Safe</Badge>
              </div>
              

            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            {/* Main Content - Menu Items - Shows first on mobile */}
            <div className="lg:col-span-3 order-1 lg:order-1">
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
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                    {/* Meal Type Selector - Visible on both mobile and desktop */}
                    <div className="w-full lg:w-56">
                      <Select value={mealType} onValueChange={(value) => setMealType(value as 'breakfast' | 'lunch' | 'dinner')}>
                        <SelectTrigger className="w-full h-12 lg:h-16 border-2 lg:border-3 border-orange-300 rounded-xl lg:rounded-2xl bg-gradient-to-r from-white to-orange-50 shadow-lg text-base lg:text-lg font-medium hover:border-orange-400 transition-colors">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 text-orange-600" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast" className="text-base lg:text-lg py-2 lg:py-3">
                            🌅 Breakfast
                          </SelectItem>
                          <SelectItem value="lunch" className="text-base lg:text-lg py-2 lg:py-3">
                            🌞 Lunch
                          </SelectItem>
                          <SelectItem value="dinner" className="text-base lg:text-lg py-2 lg:py-3">
                            🌙 Dinner
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full lg:w-56 h-12 lg:h-16 border-2 lg:border-3 border-gray-300 rounded-xl lg:rounded-2xl bg-white shadow-lg text-base lg:text-lg font-medium">
                        <Filter className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 text-orange-500" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category} className="text-base lg:text-lg py-2 lg:py-3">
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

                {/* Meal Type Selector - Prominent for all screens */}
                <div className="mt-6 lg:mt-8">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 text-center">🍽️ Choose Your Meal Time</h3>
                  <div className="grid grid-cols-3 gap-3 lg:gap-4 max-w-2xl mx-auto">
                    {[
                      { value: 'breakfast', label: 'Breakfast', icon: '🌅', time: '6 AM - 11 AM' },
                      { value: 'lunch', label: 'Lunch', icon: '🌞', time: '11 AM - 4 PM' },
                      { value: 'dinner', label: 'Dinner', icon: '🌙', time: '4 PM - 11 PM' }
                    ].map(({ value, label, icon, time }) => (
                      <Button
                        key={value}
                        variant={mealType === value ? 'default' : 'outline'}
                        onClick={() => setMealType(value as 'breakfast' | 'lunch' | 'dinner')}
                        className={`h-20 lg:h-24 flex flex-col items-center justify-center font-bold text-sm lg:text-base transition-all duration-300 rounded-xl lg:rounded-2xl ${
                          mealType === value 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl scale-105 border-2 border-orange-400' 
                            : 'border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 hover:scale-105 bg-white shadow-md'
                        }`}
                      >
                        <span className="text-2xl lg:text-3xl mb-1">{icon}</span>
                        <span className="text-sm lg:text-base font-bold">{label}</span>
                        <span className="text-xs lg:text-sm opacity-75 mt-1">{time}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Category Filters */}
                <div className="space-y-4 mt-8">
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
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        cartQuantity={cartQuantity}
                        onAddToCart={addToCartById}
                        onUpdateQuantity={updateQuantityById}
                        onRemoveFromCart={removeFromCartById}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    )
                  })}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredItems.length === 0 && (
                <div className="text-center py-16">
                  <ChefHat className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-700">Try adjusting your search or filter criteria</p>
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

            {/* Sidebar - Cart & Order Details - Hidden on mobile, replaced with floating cart */}
            <div className="lg:col-span-1 order-2 lg:order-2 hidden lg:block">
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
                          <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-700 text-sm">Your cart is empty</p>
                          <p className="text-gray-600 text-xs">Add delicious items to get started</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.menuItemId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="font-medium text-sm lg:text-base text-gray-900 leading-tight truncate">{item.name}</h4>
                              <p className="text-orange-600 font-semibold text-sm lg:text-base">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="h-9 w-9 lg:h-10 lg:w-10 p-0 text-red-700 hover:bg-red-100 hover:text-red-800 border-2 border-red-500 hover:border-red-600 bg-white font-bold shadow-sm"
                              >
                                <Minus className="h-4 w-4 lg:h-5 lg:w-5" />
                              </Button>
                              <span className="font-bold text-base lg:text-lg w-10 lg:w-12 text-center bg-orange-100 rounded-lg px-2 py-1 text-gray-900 border border-orange-200">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                className="h-9 w-9 lg:h-10 lg:w-10 p-0 text-green-700 hover:bg-green-100 hover:text-green-800 border-2 border-green-500 hover:border-green-600 bg-white font-bold shadow-sm"
                              >
                                <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Static Delivery Order Type */}
                    {cart.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">Delivery Service</p>
                              <p className="text-sm text-green-700">We deliver to your doorstep</p>
                            </div>
                          </div>
                        </div>

                        {/* Pre-order Options */}
                        {preorderEnabled && (
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
                        )}

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
                        
                        {/* Delivery Promise Note */}
                        {orderType === 'DELIVERY' && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                🚚 Your order will be delivered within 30 minutes
                              </span>
                            </div>
                          </div>
                        )}
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

                {/* Confirm Order Button */}
                {cart.length > 0 && (
                  <div className="space-y-4 lg:space-y-6">
                    <Button
                      onClick={handleSubmitOrder}
                      className="w-full h-10 sm:h-12 md:h-14 lg:h-16 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 hover:from-orange-700 hover:via-orange-600 hover:to-red-600 text-white text-xs sm:text-sm md:text-base lg:text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 border-0 rounded-lg sm:rounded-xl relative overflow-hidden group px-3 sm:px-4 md:px-6 lg:px-8"
                      size="lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center space-x-1.5 sm:space-x-2 md:space-x-2.5">
                        <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                        <span className="font-semibold tracking-wide text-xs sm:text-sm md:text-base">🚀 CONFIRM ORDER • {formatCurrency(total)}</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                      </div>
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

        {/* Mobile Floating Cart - Enhanced for better UX */}
        <div className="lg:hidden">
          {cart.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-50">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl rounded-xl p-4 border-2 border-orange-400 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-lg">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                    <p className="text-orange-100 text-sm">Total: {formatCurrency(total)}</p>
                  </div>
                  <Link href="/public/cart">
                    <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-6 py-3 rounded-lg shadow-lg">
                      View Cart
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Floating Cart - Compact version */}
        <div className="hidden lg:block">
          {cart.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3">
              {/* Cart Summary */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl rounded-lg px-4 py-3 border border-orange-600 backdrop-blur-sm">
                <p className="text-sm font-medium leading-tight">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items • {formatCurrency(total)}
                </p>
              </div>
              {/* Floating Cart Icon */}
              <CartIcon 
                itemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
                variant="floating"
                className="w-16 h-16 hover:scale-110 transition-transform shadow-2xl"
                href="/public/cart"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}