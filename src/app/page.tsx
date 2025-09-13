'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Clock, Star, Filter, Search, ArrowRight } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">R</span>
              </div>
              <h1 className="text-5xl font-bold">Royal Food</h1>
            </div>
            <p className="text-xl mb-8 text-blue-100">Authentic flavors, royal treatment, delivered fresh to your door</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/public/order">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Now
                </Button>
              </Link>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15-30 min delivery
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  4.8 rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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

        {/* Call to Action */}
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
