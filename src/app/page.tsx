'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Clock, Star, Filter, Search, ArrowRight, Plus, Minus, Heart, Shield, Award, Zap, Truck, ChefHat, Trash2, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CartIcon } from '@/components/ui/cart-icon'
import { getContactPhone } from '@/lib/restaurant-config'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/currency-config'
import MenuItemCard from '@/components/ui/MenuItemCard'

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
  rating?: number
  isPopular?: boolean
  isNew?: boolean
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cart, setCart] = useState<(MenuItem & {quantity: number})[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'popular'>('name')
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000})
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Additional filter states
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all')

  const router = useRouter()

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('royal-food-cart')
    if (savedCart) {
      try {
        const storedCart = JSON.parse(savedCart)
        console.log('🏠 Home page loading from localStorage:', storedCart)
        
        // Handle STANDARDIZED format - works with both id and menuItemId
        const normalizedCart = storedCart.map((item: any) => ({
          id: item.menuItemId || item.id, // Support both formats - use id for internal state
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          category: item.category
        }))
        setCart(normalizedCart)
        console.log('🏠 Home page loaded and normalized:', normalizedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('royal-food-cart')
      }
    }
    setIsCartLoaded(true)
  }, [])

  // Save cart to localStorage whenever cart changes (but not on initial empty load)
  useEffect(() => {
    if (isCartLoaded && cart.length > 0) {
      // Save in STANDARDIZED format with both id and menuItemId
      const standardizedCart = cart.map(item => ({
        id: item.id,
        menuItemId: item.id, // Use item.id for menuItemId field
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))
      localStorage.setItem('royal-food-cart', JSON.stringify(standardizedCart))
      console.log('🏠 Home page saving to localStorage (standardized):', standardizedCart)
    } else if (isCartLoaded && cart.length === 0) {
      // Clear localStorage when cart is empty
      localStorage.removeItem('royal-food-cart')
      console.log('🏠 Home page cleared empty cart from localStorage')
    }
  }, [cart, isCartLoaded])

  // Helper function to get total cart items
  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Load menu items
  useEffect(() => {
    loadMenuItems()
  }, [])

  // Load search history from localStorage
  useEffect(() => {
    const savedSearchHistory = localStorage.getItem('royal-food-search-history')
    if (savedSearchHistory) {
      try {
        setSearchHistory(JSON.parse(savedSearchHistory))
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    }
  }, [])

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('royal-food-search-history', JSON.stringify(searchHistory))
  }, [searchHistory])

  // Generate search suggestions based on menu items
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const suggestions = new Set<string>()
      
      // Add matching item names
      menuItems.forEach(item => {
        if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.add(item.name)
        }
        if (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.add(item.name)
        }
        if (item.category.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.add(item.category)
        }
      })
      
      // Add search history that matches
      searchHistory.forEach(history => {
        if (history.toLowerCase().includes(searchQuery.toLowerCase())) {
          suggestions.add(history)
        }
      })
      
      setSearchSuggestions(Array.from(suggestions).slice(0, 8))
      setShowSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, menuItems, searchHistory])

  // Enhanced filtering and sorting logic
  useEffect(() => {
    let filtered = menuItems

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by price range
    filtered = filtered.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    )

    // Filter by availability
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (availabilityFilter === 'available') return item.isAvailable
        if (availabilityFilter === 'unavailable') return !item.isAvailable
        return true
      })
    }

    // Filter by meal type
    if (selectedMealTypeFilter !== 'all') {
      filtered = filtered.filter(item => 
        (item.mealTypes?.includes(selectedMealTypeFilter.toUpperCase() as any) ?? false)
      )
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'rating':
          // Rating not available in MenuItem type, sort by name for now
          return a.name.localeCompare(b.name)
        case 'popular':
          // Sort by availability first (available items first), then by name
          if (a.isAvailable !== b.isAvailable) {
            return b.isAvailable ? 1 : -1
          }
          return a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredItems(filtered)
  }, [menuItems, selectedCategory, searchQuery, sortBy, priceRange, availabilityFilter, selectedMealTypeFilter])

  // Clear search and all filters
  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setPriceRange({min: 0, max: 1000})
    setSortBy('name')
    setAvailabilityFilter('all')
    setSelectedMealTypeFilter('all')
    setShowSuggestions(false)
  }

  const loadMenuItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/menu/list')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data.items || [])
      } else {
        console.error('Failed to load menu items')
      }
    } catch (error) {
      console.error('Error loading menu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cart functions
  const addToCart = (itemId: string) => {
    const menuItem = menuItems.find(item => item.id === itemId)
    if (!menuItem) return
    
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId)
      if (existing) {
        return prev.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      // Add both id and menuItemId for standardized format
      return [...prev, { 
        ...menuItem, 
        menuItemId: menuItem.id, // Add menuItemId for cross-page compatibility
        quantity: 1 
      }]
    })
  }

  const getCartQuantity = (itemId: string) => {
    return cart.find(item => item.id === itemId)?.quantity || 0
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId))
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]

  // Search suggestion functions with enhanced functionality
  const searchRef = useRef<HTMLDivElement>(null)
  
  const generateSearchSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([])
      return
    }
    
    const suggestions = menuItems
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
      .map(item => item.name)
    
    setSearchSuggestions(suggestions)
  }, [menuItems])

  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('royal-food-search-history', JSON.stringify(newHistory))
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    
    setSearchQuery(query)
    addToSearchHistory(query)
    setShowSuggestions(false)
    
    // Auto-select category if search is category-specific
    const matchingCategory = categories.find(cat => 
      cat !== 'all' && query.toLowerCase().includes(cat.toLowerCase())
    )
    if (matchingCategory && selectedCategory === 'all') {
      setSelectedCategory(matchingCategory)
    }
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate suggestions when search query changes
  useEffect(() => {
    generateSearchSuggestions(searchQuery)
  }, [searchQuery, generateSearchSuggestions])

  // Get popular/featured items
  const popularItems = menuItems.filter(item => item.isPopular || item.rating && item.rating >= 4.5).slice(0, 4)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-yellow-50/20">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Premium Header - Amazon Style */}
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
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* Contact Info - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-200">
                <Phone className="h-4 w-4 text-orange-600" />
                <a href={`tel:${getContactPhone()}`} className="text-gray-700 font-medium hover:text-orange-600 transition-colors">
                  {getContactPhone()}
                </a>
              </div>
              
              <Link href="/public/order">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-4 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg text-sm sm:text-lg">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Order Now</span>
                  <span className="sm:hidden">Order</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Hero Section - Mobile First */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-12 lg:py-20">
          <div className="text-center">
            <h2 className="text-xl sm:text-3xl lg:text-6xl font-bold mb-2 sm:mb-4 lg:mb-6 leading-tight">
              <span className="block sm:hidden">🍽️ Royal Food</span>
              <span className="hidden sm:block">
                Delicious Food<br />
                <span className="text-yellow-300">Delivered Fast</span>
              </span>
            </h2>
            <p className="text-sm sm:text-lg lg:text-2xl mb-4 sm:mb-6 lg:mb-8 text-orange-100">
              <span className="block sm:hidden">Premium food, fast delivery</span>
              <span className="hidden sm:block">Experience premium quality food with lightning-fast delivery</span>
            </p>
            <Link href="/public/order">
              <Button className="bg-white !text-orange-600 hover:bg-orange-50 hover:!text-orange-700 font-bold px-6 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl shadow-xl text-sm sm:text-lg lg:text-xl border border-orange-200 w-full sm:w-auto">
                🛒 <span className="ml-2">
                  <span className="sm:hidden">Order Now</span>
                  <span className="hidden sm:inline">Order Now • Free Delivery</span>
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Compact Search Section */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-200 p-4 mb-6">
          {/* Compact Search Bar */}
          <div className="flex gap-3 items-center mb-4">
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-5 w-5" />
                <Input
                  placeholder="Search delicious food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 pr-4 h-12 text-base border-2 border-gray-300 focus:border-orange-500 rounded-xl bg-white shadow-sm font-medium"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                )}
              </div>
              
              {/* Compact Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-40 mt-1 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {searchSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        className="w-full text-left p-2 hover:bg-orange-50 rounded text-sm flex items-center gap-2"
                      >
                        <Search className="h-3 w-3 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-4 border-2 rounded-xl font-medium transition-all ${
                showFilters 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
              }`}
            >
              <Filter className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
              {/* Primary Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10 border border-gray-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-sm py-2">
                          {category === 'all' ? '🍽️ All Categories' : `🍴 ${category}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Meal Type Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Available For</label>
                  <Select value={selectedMealTypeFilter} onValueChange={(value) => setSelectedMealTypeFilter(value as any)}>
                    <SelectTrigger className="h-10 border border-gray-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm py-2">
                        🌅 All Meal Times
                      </SelectItem>
                      <SelectItem value="breakfast" className="text-sm py-2">
                        🌅 Breakfast Only
                      </SelectItem>
                      <SelectItem value="lunch" className="text-sm py-2">
                        🌞 Lunch Only
                      </SelectItem>
                      <SelectItem value="dinner" className="text-sm py-2">
                        🌙 Dinner Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
                  <Select value={availabilityFilter} onValueChange={(value) => setAvailabilityFilter(value as any)}>
                    <SelectTrigger className="h-10 border border-gray-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm py-2">
                        📋 All Items
                      </SelectItem>
                      <SelectItem value="available" className="text-sm py-2">
                        ✅ Available Now
                      </SelectItem>
                      <SelectItem value="unavailable" className="text-sm py-2">
                        ❌ Currently Unavailable
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger className="h-10 border border-gray-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name" className="text-sm py-2">
                        📝 Name (A-Z)
                      </SelectItem>
                      <SelectItem value="price" className="text-sm py-2">
                        💰 Price (Low to High)
                      </SelectItem>
                      <SelectItem value="rating" className="text-sm py-2">
                        ⭐ Rating (High to Low)
                      </SelectItem>
                      <SelectItem value="popular" className="text-sm py-2">
                        🔥 Most Popular
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Secondary Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Min Price"
                        value={priceRange.min || ''}
                        onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value) || 0}))}
                        className="h-10 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <span className="text-gray-400 font-medium">to</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Max Price"
                        value={priceRange.max || ''}
                        onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value) || 1000}))}
                        className="h-10 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>Min: ₹{priceRange.min}</span>
                    <span>Max: ₹{priceRange.max}</span>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Actions</label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSearch}
                      className="h-10 w-full text-sm"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filter Results Summary */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium text-orange-600">{filteredItems.length}</span> of {menuItems.length} items
                  {(searchQuery || selectedCategory !== 'all' || availabilityFilter !== 'all' || selectedMealTypeFilter !== 'all' || priceRange.min > 0 || priceRange.max < 1000) && (
                    <span className="text-xs text-gray-500 ml-1">with active filters</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Category Quick Access */}
          {!showFilters && (
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.slice(0, 6).map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`h-8 px-4 text-xs font-medium transition-all rounded-full ${
                    selectedCategory === category 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                      : 'border border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Cart Section with Responsive Icons - Hidden for now to prevent overlap */}
        {false && cart.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm border-2 border-orange-200 rounded-2xl lg:rounded-3xl shadow-2xl p-4 lg:p-8 mb-8 lg:mb-10 relative">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <ShoppingCart className="h-5 w-5 lg:h-7 lg:w-7 text-orange-500" />
                <h3 className="text-lg lg:text-2xl font-bold text-gray-800">
                  Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                </h3>
              </div>
              <Button
                onClick={() => router.push('/public/cart')}
                className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 hover:from-orange-700 hover:via-orange-600 hover:to-red-600 text-white font-bold py-2.5 sm:py-3 md:py-3.5 lg:py-4 px-4 sm:px-6 md:px-8 lg:px-10 rounded-lg sm:rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 text-xs sm:text-sm md:text-base lg:text-lg w-full border-0 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-1.5 sm:space-x-2 md:space-x-2.5">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-5 lg:w-5" />
                  <span className="font-semibold tracking-wide">CHECKOUT</span>
                </div>
              </Button>
            </div>
            
            <div className="space-y-3 lg:space-y-4 max-h-48 lg:max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3 lg:space-x-4 flex-1">
                    <div className="relative">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 lg:w-16 lg:h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm lg:text-lg truncate">{item.name}</h4>
                      <p className="text-xs lg:text-sm text-gray-600">${item.price} × {item.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="flex items-center space-x-1 lg:space-x-2 bg-white rounded-lg border border-gray-300 px-2 lg:px-3 py-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-6 w-6 lg:h-8 lg:w-8 p-0 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                      <span className="text-sm lg:text-base font-medium w-6 lg:w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6 lg:h-8 lg:w-8 p-0 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                      className="h-8 w-8 lg:h-10 lg:w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 lg:pt-6 mt-4 lg:mt-6">
              <div className="flex justify-between items-center mb-3 lg:mb-4">
                <span className="text-lg lg:text-xl font-bold text-gray-800">Total:</span>
                <span className="text-xl lg:text-2xl font-bold text-orange-600">
                  ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex gap-2 lg:gap-4">
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="flex-1 py-2 lg:py-3 text-sm lg:text-base border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl lg:rounded-2xl"
                >
                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Clear Cart
                </Button>
                <Button
                  onClick={() => router.push('/public/cart')}
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white py-2.5 sm:py-3 md:py-3.5 lg:py-4 px-3 sm:px-4 md:px-6 lg:px-8 text-xs sm:text-sm md:text-base lg:text-lg rounded-lg sm:rounded-xl shadow-2xl hover:shadow-3xl font-semibold tracking-wide transform hover:scale-[1.02] transition-all duration-300 border-0 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-1.5 sm:space-x-2 md:space-x-2.5">
                    <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-5 lg:w-5" />
                    <span className="font-semibold">PROCEED TO CHECKOUT</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* All Menu Items - Amazon Style Grid */}
        <section>
          <div className="text-center mb-6 lg:mb-8 px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">🍽️ Our Complete Menu</h2>
            <p className="text-lg sm:text-xl text-gray-600">Discover delicious dishes crafted with premium ingredients</p>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => {
                const cartQuantity = getCartQuantity(item.id)
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    cartQuantity={cartQuantity}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveFromCart={removeFromCart}
                    showOrderNowButton={true}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <ChefHat className="h-24 w-24 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-700 mb-6">Try adjusting your search or filter criteria</p>
              <Button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all') }} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-3xl p-6 sm:p-8 lg:p-12 text-white text-center">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Order?</h3>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-orange-100 px-4">
            Experience our premium food delivery service today
          </p>
          <Link href="/public/order">
            <Button className="bg-white !text-orange-600 hover:bg-orange-50 hover:!text-orange-700 font-bold px-4 sm:px-8 lg:px-12 py-3 sm:py-4 rounded-2xl shadow-xl text-sm sm:text-lg lg:text-xl border-2 border-orange-200">
              <span className="sm:hidden">🛒 Order Now</span>
              <span className="hidden sm:inline">🛒 Start Ordering Now</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ml-2 sm:ml-3" />
            </Button>
          </Link>
        </div>

        {/* Popular Items Section */}
        {popularItems.length > 0 && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Favorites</h2>
              <p className="text-gray-600">Most loved dishes by our customers</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartQuantity={getCartQuantity(item.id)}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveFromCart={removeFromCart}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}

        {/* Filter and Search Section */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-700" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 lg:left-5 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4 lg:w-5 lg:h-5" />
              <Input
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {/* Menu Items Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === 'all' 
                ? 'All Dishes' 
                : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
              }
            </h2>
            <span className="text-gray-600">{filteredItems.length} items</span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartQuantity={getCartQuantity(item.id)}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveFromCart={removeFromCart}
                  showOrderNowButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-600 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-700 mb-4">Try adjusting your search or filter criteria</p>
              <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all') }} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </section>

        {/* Final Call to Action */}
        <section className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Choose your favorite dishes and get them delivered fresh to your door
              </p>
              <Link href="/public/order">
                <Button size="lg" className="bg-white !text-blue-600 hover:bg-blue-50 hover:!text-blue-700 font-semibold px-8 py-3 text-lg border-2 border-blue-200">
                  Start Ordering
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information & Footer */}
        <footer className="mt-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Company Information */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      Royal Food
                    </h3>
                    <p className="text-gray-300 text-sm">Premium Food Delivery Platform</p>
                  </div>
                </div>
                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  Experience the finest cuisine with Royal Food - your trusted partner for 
                  delicious meals delivered fresh to your doorstep. We pride ourselves on 
                  quality, speed, and exceptional customer service.
                </p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold px-3 py-2">
                    <Star className="h-4 w-4 fill-current mr-2" />
                    4.9★ Rating
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-3 py-2">
                    <Shield className="h-4 w-4 mr-2" />
                    100% Safe
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">Contact Us</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <Phone className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Call Us</p>
                      <a href={`tel:${getContactPhone()}`} className="text-white font-medium hover:text-orange-400 transition-colors">
                        {getContactPhone()}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Service Hours</p>
                      <p className="text-white font-medium">24/7 Available</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Truck className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Delivery</p>
                      <p className="text-white font-medium">Fast & Free</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
                <div className="space-y-3">
                  <Link href="/public/order" className="block text-gray-300 hover:text-orange-400 transition-colors font-medium">
                    Order Now
                  </Link>
                  <Link href="/public/cart" className="block text-gray-300 hover:text-orange-400 transition-colors font-medium">
                    View Cart
                  </Link>
                  <Link href="/menu" className="block text-gray-300 hover:text-orange-400 transition-colors font-medium">
                    Our Menu
                  </Link>
                  <Link href="/admin" className="block text-gray-300 hover:text-orange-400 transition-colors font-medium">
                    Admin Panel
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700 mt-12 pt-8">
              <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
                <div className="text-gray-400 text-sm text-center lg:text-left">
                  <p>&copy; 2025 Royal Food. All rights reserved. Made with ❤️ for food lovers.</p>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                  <a href={`tel:${getContactPhone()}`} className="inline-flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-3 sm:px-4 md:px-4 py-2 sm:py-2 md:py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base md:text-base">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" />
                    <span className="text-xs sm:text-sm md:text-base">Call Now</span>
                  </a>
                  <Link href="/public/order" className="inline-flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-3 sm:px-4 md:px-4 py-2 sm:py-2 md:py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base md:text-base">
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" />
                    <span className="text-xs sm:text-sm md:text-base">Order Now</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Cart Summary - Only show when cart has items */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3">
          {/* Cart Summary Card */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-orange-600 backdrop-blur-sm max-w-[200px] sm:max-w-none">
            <p className="text-xs sm:text-sm font-medium leading-tight">
              {getCartItemCount()} items • {formatCurrency(cart.reduce((total, item) => total + (item.price * item.quantity), 0))}
            </p>
          </div>
          {/* Floating Cart Icon */}
          <CartIcon 
            itemCount={getCartItemCount()}
            variant="floating"
            className="w-14 h-14 sm:w-16 sm:h-16 hover:scale-110 transition-transform shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
