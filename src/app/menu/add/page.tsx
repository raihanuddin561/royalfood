'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  costPrice: number
  currentStock: number
}

interface Category {
  id: string
  name: string
}

export default function AddMenuItemPage() {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    prepTime: '',
    isAvailable: true
  })

  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([])
  const [showIngredientSelector, setShowIngredientSelector] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch categories and inventory items
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 Starting to fetch categories and inventory items...')
        const [categoriesResponse, inventoryResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/inventory/items')
        ])

        console.log('📊 Categories response status:', categoriesResponse.status)
        console.log('📦 Inventory response status:', inventoryResponse.status)

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          console.log('✅ Categories loaded:', categoriesData)
          setCategories(categoriesData)
        } else {
          console.error('❌ Categories failed:', await categoriesResponse.text())
        }

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json()
          console.log('✅ Inventory items loaded:', inventoryData)
          setInventoryItems(inventoryData)
        } else {
          console.error('❌ Inventory failed:', await inventoryResponse.text())
        }
      } catch (error) {
        console.error('💥 Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const calculateCostPrice = () => {
    return selectedIngredients.reduce((total, ingredient) => {
      return total + (ingredient.quantity * ingredient.cost)
    }, 0)
  }

  const calculateProfitMargin = () => {
    const price = parseFloat(formData.price) || 0
    const costPrice = calculateCostPrice()
    if (price === 0) return 0
    return Math.round(((price - costPrice) / price) * 100)
  }

  const addIngredient = (inventoryItem: InventoryItem) => {
    const newIngredient: Ingredient = {
      id: inventoryItem.id,
      name: inventoryItem.name,
      quantity: 1,
      unit: inventoryItem.unit,
      cost: inventoryItem.costPrice
    }
    setSelectedIngredients([...selectedIngredients, newIngredient])
    setShowIngredientSelector(false)
  }

  const updateIngredientQuantity = (id: string, quantity: number) => {
    setSelectedIngredients(prev =>
      prev.map(ing => 
        ing.id === id ? { ...ing, quantity, cost: ing.cost } : ing
      )
    )
  }

  const removeIngredient = (id: string) => {
    setSelectedIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          prepTime: parseInt(formData.prepTime),
          ingredients: selectedIngredients
        })
      })

      if (response.ok) {
        window.location.href = '/menu'
      } else {
        console.error('Failed to create menu item')
        alert('Failed to create menu item. Please try again.')
      }
    } catch (error) {
      console.error('Error creating menu item:', error)
      alert('Error creating menu item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/menu"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add Menu Item</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new item for your restaurant menu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Basic Information */}
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Menu Item Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter menu item name"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <div className="mt-1">
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Describe your menu item..."
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="sm:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Selling Price (BDT) *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="price"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">
                  Preparation Time (minutes)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="prepTime"
                    id="prepTime"
                    min="1"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="15"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="sm:col-span-2">
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="isAvailable"
                      name="isAvailable"
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isAvailable" className="font-medium text-gray-700">
                      Available for orders
                    </label>
                    <p className="text-gray-500">Item will be visible to customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe & Ingredients */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recipe & Cost Calculation</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add ingredients to automatically calculate the cost price
              </p>
            </div>

            <div className="mt-6">
              {/* Add Ingredient Button */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-700">Ingredients</h4>
                <button
                  type="button"
                  onClick={() => setShowIngredientSelector(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </button>
              </div>

              {/* Ingredients List */}
              {selectedIngredients.length > 0 ? (
                <div className="space-y-3">
                  {selectedIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{ingredient.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredientQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-sm text-gray-500">{ingredient.unit}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 w-20 text-right">
                          {formatCurrency(ingredient.quantity * ingredient.cost)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">No ingredients added yet</p>
                </div>
              )}

              {/* Cost Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Cost Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(calculateCostPrice())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Selling Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(parseFloat(formData.price) || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className={`text-lg font-semibold ${calculateProfitMargin() > 30 ? 'text-green-600' : calculateProfitMargin() > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {calculateProfitMargin()}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Menu Item Image</h3>
              <p className="mt-1 text-sm text-gray-600">
                Upload an image for your menu item (optional)
              </p>
            </div>

            <div className="mt-6">
              <div className="flex justify-center px-6 py-10 border-2 border-gray-300 border-dashed rounded-md">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload a file or drag and drop
                      </span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <Link
              href="/menu"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Menu Item'}
            </button>
          </div>
        </div>
      </form>

      {/* Ingredient Selector Modal */}
      {showIngredientSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Ingredient</h3>
              <button
                onClick={() => setShowIngredientSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-2 text-xs text-gray-500">
              Debug: Found {inventoryItems.length} inventory items
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inventoryItems.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No inventory items found.</p>
                  <p className="text-xs mt-2">Make sure you have added items to your inventory.</p>
                </div>
              ) : (
                inventoryItems
                  .filter(item => !selectedIngredients.find(selected => selected.id === item.id))
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => addIngredient(item)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-md border"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(item.costPrice)}/{item.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Stock: {item.currentStock} {item.unit}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
