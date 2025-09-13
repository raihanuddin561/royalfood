'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Clock, Star, Filter, Search, ArrowRight, Plus, Minus, Heart, Shield, Award, Zap, Truck, ChefHat } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/currency-config'

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [cart, setCart] = useState<(MenuItem & {quantity: number})[]>([])

  // Load menu items
  useEffect(() => {
    loadMenuItems()
  }, [])

  // Filter items based on category and search
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

    setFilteredItems(filtered)
  }, [menuItems, selectedCategory, searchQuery])

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
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId)
      if (existing) {
        return prev.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id: itemId, quantity: 1 }]
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

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]

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
              <Link href="/public/order">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg text-lg">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Order Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Amazon Style */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-6xl font-bold mb-6 leading-tight">
              Delicious Food<br />
              <span className="text-yellow-300">Delivered Fast</span>
            </h2>
            <p className="text-2xl mb-8 text-orange-100">
              Experience premium quality food with lightning-fast delivery
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/public/order">
                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-12 py-4 rounded-2xl shadow-xl text-xl">
                  🛒 Order Now • Free Delivery
                </Button>
              </Link>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 font-bold px-12 py-4 rounded-2xl text-xl">
                📱 Download App
              </Button>
            </div>
          </div>
        </div>
      </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section - Amazon Style */}
        <div className="bg-gradient-to-r from-white via-orange-50/50 to-white rounded-3xl shadow-2xl border-2 border-orange-200 p-8 mb-10">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-orange-500 h-6 w-6" />
                <Input
                  placeholder="Search for delicious food, cuisines, restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16 h-16 text-lg border-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-2xl bg-white shadow-lg font-medium"
                />
              </div>
            </div>
            
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
          </div>
          
          {/* Category Pills */}
          <div className="mt-6 flex flex-wrap gap-4">
            {categories.slice(0, 8).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={`h-12 px-6 font-bold transition-all duration-300 rounded-2xl ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl' 
                    : 'border-3 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700'
                }`}
              >
                {category === 'all' ? '🍽️ All Items' : `🍴 ${category}`}
              </Button>
            ))}
          </div>
        </div>

        {/* All Menu Items - Amazon Style Grid */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">🍽️ Our Complete Menu</h2>
            <p className="text-xl text-gray-600">Discover delicious dishes crafted with premium ingredients</p>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => {
                const cartQuantity = getCartQuantity(item.id)
                return (
                  <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-orange-400 bg-white overflow-hidden hover:scale-[1.02] transform">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
                          <ChefHat className="h-16 w-16 text-orange-400" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1">
                          25% OFF
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 h-10 w-10 p-0 rounded-full shadow-md"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 hover:text-orange-600 transition-colors cursor-pointer line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">(4.8)</span>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-orange-600">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(Math.round(item.price * 1.33))}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {cartQuantity > 0 ? (
                            <div className="flex items-center justify-center space-x-3 bg-orange-50 rounded-lg p-2 border border-orange-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, cartQuantity - 1)}
                                className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-100 text-orange-600"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-xl text-orange-700 min-w-[40px] text-center">
                                {cartQuantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, cartQuantity + 1)}
                                className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-100 text-orange-600"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => addToCart(item.id)}
                                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                              
                              <Link href="/public/order">
                                <Button
                                  variant="outline"
                                  className="w-full h-10 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg"
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  Order Now
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <ChefHat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
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
        <div className="mt-16 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-4xl font-bold mb-4">Ready to Order?</h3>
          <p className="text-xl mb-8 text-orange-100">
            Experience our premium food delivery service today
          </p>
          <Link href="/public/order">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-12 py-4 rounded-2xl shadow-xl text-xl">
              🛒 Start Ordering Now
              <ArrowRight className="h-6 w-6 ml-3" />
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
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <span className="text-gray-500 text-3xl">🍽️</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {item.isNew && (
                        <Badge className="bg-green-500 text-white border-0">New</Badge>
                      )}
                      {item.isPopular && (
                        <Badge className="bg-orange-500 text-white border-0">Popular</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(item.price)}
                      </span>
                      {item.prepTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.prepTime}min
                        </Badge>
                      )}
                    </div>
                    {item.rating && (
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(item.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">({item.rating})</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Filter and Search Section */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-500" />
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-white">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <span className="text-blue-500 text-3xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {item.isNew && (
                        <Badge className="bg-green-500 text-white border-0">New</Badge>
                      )}
                      {item.isPopular && (
                        <Badge className="bg-orange-500 text-white border-0">Popular</Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="destructive" className="bg-red-500 text-white border-0">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                        {item.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(item.price)}
                      </span>
                      {item.prepTime && (
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.prepTime}min
                        </Badge>
                      )}
                    </div>
                    {item.rating && (
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(item.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">({item.rating})</span>
                      </div>
                    )}
                    
                    {/* Prominent Order Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg"
                        disabled={!item.isAvailable}
                        onClick={() => {
                          const cartItem = cart.find(cartItem => cartItem.id === item.id);
                          if (cartItem) {
                            setCart(cart.map(cartItem => 
                              cartItem.id === item.id 
                                ? {...cartItem, quantity: cartItem.quantity + 1}
                                : cartItem
                            ));
                          } else {
                            setCart([...cart, {...item, quantity: 1}]);
                          }
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
                        disabled={!item.isAvailable}
                        asChild
                      >
                        <Link href="/public/order">
                          Order Now
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
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
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg">
                  Start Ordering
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
