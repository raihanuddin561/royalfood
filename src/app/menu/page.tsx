'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Clock, Power, PowerOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import MenuItemImage from '@/components/ui/MenuItemImage'
import { toast } from 'sonner'

type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  costPrice: number
  deliveryCharge: number
  isAvailable: boolean
  isActive: boolean
  mealTypes: string[]
  image: string | null
  prepTime: number | null
  category: {
    name: string
  }
}

type Category = {
  id: string
  name: string
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMealType, setSelectedMealType] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')

  // Fetch menu data
  const fetchMenuData = async () => {
    try {
      setLoading(true)
      const [menuResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/menu-items'),
        fetch('/api/categories')
      ])

      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData)
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error fetching menu data:', error)
      toast.error('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [])

  // Toggle availability
  const toggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !currentAvailability }),
      })

      const result = await response.json()

      if (response.ok) {
        // Update local state
        setMenuItems(prev => 
          prev.map(item => 
            item.id === itemId 
              ? { ...item, isAvailable: !currentAvailability }
              : item
          )
        )
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Failed to update availability')
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      toast.error('Failed to update availability')
    }
  }

  // Bulk update availability
  const bulkUpdateAvailability = async (availability: boolean) => {
    try {
      const itemsToUpdate = filteredItems.filter(item => item.isAvailable !== availability)
      
      if (itemsToUpdate.length === 0) {
        toast.info(`All filtered items are already ${availability ? 'enabled' : 'disabled'}`)
        return
      }

      const promises = itemsToUpdate.map(item =>
        fetch(`/api/menu-items/${item.id}/availability`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isAvailable: availability }),
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(res => res.ok).length

      if (successCount === itemsToUpdate.length) {
        // Update local state
        setMenuItems(prev => 
          prev.map(item => 
            itemsToUpdate.find(updateItem => updateItem.id === item.id)
              ? { ...item, isAvailable: availability }
              : item
          )
        )
        toast.success(`${successCount} items ${availability ? 'enabled' : 'disabled'} successfully`)
      } else {
        toast.warning(`${successCount} of ${itemsToUpdate.length} items updated successfully`)
        // Refresh data to ensure consistency
        fetchMenuData()
      }
    } catch (error) {
      console.error('Error bulk updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory
    const matchesMealType = selectedMealType === 'all' || (Array.isArray(item.mealTypes) && item.mealTypes.includes(selectedMealType))
    const matchesAvailability = 
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && item.isAvailable) ||
      (availabilityFilter === 'unavailable' && !item.isAvailable)
    return matchesCategory && matchesMealType && matchesAvailability
  })

  const menuStats = {
    total: menuItems.length,
    available: menuItems.filter(item => item.isAvailable).length,
    avgPrice: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0,
    avgMargin: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + ((item.price - item.costPrice) / item.price * 100), 0) / menuItems.length : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu items...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Menu Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your restaurant menu items, pricing, and availability
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => bulkUpdateAvailability(true)}
              className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              <Power className="mr-2 h-4 w-4" />
              Enable All
            </button>
            <button
              onClick={() => bulkUpdateAvailability(false)}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Disable All
            </button>
          </div>
          <Link
            href="/menu/add"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Menu Items</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {menuStats.total}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Available Items</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
            {menuStats.available}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Unavailable Items</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
            {menuStats.total - menuStats.available}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Average Price</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {formatCurrency(menuStats.avgPrice)}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Avg Profit Margin</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            {Math.round(menuStats.avgMargin)}%
          </dd>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="Search menu items..."
            />
          </div>

          {/* Category Filter */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>

          {/* Meal Type Filter */}
          <select 
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Meal Types</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
          </select>

          {/* Availability Filter */}
          <select 
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {/* Image Placeholder */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <div className="flex items-center justify-center h-48 bg-gray-100">
                <MenuItemImage 
                  src={item.image || undefined} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</p>
                  <p className="text-sm text-gray-500">Cost: {formatCurrency(item.costPrice)}</p>
                  {item.deliveryCharge > 0 && (
                    <p className="text-sm text-blue-600">Delivery: {formatCurrency(item.deliveryCharge)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {Math.round(((item.price - item.costPrice) / item.price) * 100)}% profit
                  </p>
                  {item.prepTime && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.prepTime} min
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {item.category.name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.mealTypes?.map((mealType) => (
                      <span 
                        key={mealType}
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                          mealType === 'BREAKFAST' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : mealType === 'LUNCH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAvailability(item.id, item.isAvailable)}
                    className={`p-1 ${
                      item.isAvailable 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    title={item.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                  >
                    {item.isAvailable ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </button>
                  <Link
                    href={`/menu/${item.id}`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link 
                    href={`/menu/${item.id}/edit`}
                    className="p-1 text-gray-400 hover:text-yellow-600"
                    title="Edit Item"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    className="p-1 text-gray-400"
                    title="Delete Item (not implemented)"
                    aria-disabled="true"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (when no items match filters) */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {menuItems.length === 0 ? (
            <>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No menu items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first menu item.</p>
              <div className="mt-6">
                <Link
                  href="/menu/add"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No items match your filters</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your category or availability filters.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setAvailabilityFilter('all')
                  }}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Clear Filters
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
