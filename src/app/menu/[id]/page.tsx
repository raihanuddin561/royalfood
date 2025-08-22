'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Trash2, Clock, ChefHat, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useNotification, Notification } from '@/components/ui/Notification'

interface MenuItemData {
  id: string
  name: string
  categoryId: string
  description: string
  price: number
  costPrice: number
  prepTime: number | null
  isAvailable: boolean
  category: {
    id: string
    name: string
  }
  recipeItems: Array<{
    id: string
    itemId: string
    quantity: number
    unit: string
    cost: number
    item: {
      id: string
      name: string
      unit: string
      costPrice: number
    }
  }>
}

export default function MenuItemDetailsPage({ params }: { params: { id: string } }) {
  const { showNotification, notification, clearNotification } = useNotification()
  const [loading, setLoading] = useState(true)
  const [menuItem, setMenuItem] = useState<MenuItemData | null>(null)

  useEffect(() => {
    fetchMenuItem()
  }, [params.id])

  const fetchMenuItem = async () => {
    try {
      const response = await fetch(`/api/menu-items/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu item')
      }

      const data = await response.json()
      setMenuItem(data)
    } catch (error) {
      console.error('Error fetching menu item:', error)
      showNotification('error', 'Failed to load menu item', 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading menu item...</div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Menu item not found</div>
      </div>
    )
  }

  const profitMargin = menuItem.price > 0 ? Math.round(((menuItem.price - menuItem.costPrice) / menuItem.price) * 100) : 0
  const profit = menuItem.price - menuItem.costPrice

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {notification && (
        <Notification 
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/menu"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{menuItem.name}</h1>
            <p className="mt-2 text-sm text-gray-700">
              Menu item details and recipe information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/menu/${menuItem.id}/edit`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </Link>
        </div>
      </div>

      {/* Menu Item Overview */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{menuItem.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Category: {menuItem.category.name}</p>
            </div>
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              menuItem.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {menuItem.isAvailable ? 'Available' : 'Unavailable'}
            </div>
          </div>
          
          {menuItem.description && (
            <p className="mt-3 text-gray-600">{menuItem.description}</p>
          )}
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Selling Price</p>
                  <p className="text-lg font-semibold text-blue-900">{formatCurrency(menuItem.price)}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChefHat className="h-6 w-6 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">Cost Price</p>
                  <p className="text-lg font-semibold text-orange-900">{formatCurrency(menuItem.costPrice)}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-6 w-6 flex items-center justify-center bg-green-600 rounded text-white text-xs font-bold">%</div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Profit Margin</p>
                  <p className="text-lg font-semibold text-green-900">{profitMargin}%</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Prep Time</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {menuItem.prepTime ? `${menuItem.prepTime} min` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profitability Analysis */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability Analysis</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Revenue per item</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(menuItem.price)}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Cost per item</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(menuItem.costPrice)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Profit per item</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(profit)}</p>
          </div>
        </div>
      </div>

      {/* Recipe Ingredients */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recipe Ingredients</h3>
        
        {menuItem.recipeItems.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No recipe defined</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add ingredients to this menu item to track costs and inventory usage.
            </p>
            <div className="mt-6">
              <Link
                href={`/menu/${menuItem.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Add Recipe
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItem.recipeItems.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{recipe.item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(recipe.item.costPrice)} per {recipe.item.unit}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{recipe.quantity} {recipe.unit}</p>
                  <p className="text-xs text-gray-500">Quantity</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(recipe.cost)}</p>
                  <p className="text-xs text-gray-500">Total Cost</p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Recipe Cost:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(menuItem.costPrice)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
