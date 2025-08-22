'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react'
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

interface Category {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  costPrice: number
}

interface SelectedIngredient {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
}

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showNotification, notification, clearNotification } = useNotification()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuItem, setMenuItem] = useState<MenuItemData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [showIngredientSelector, setShowIngredientSelector] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    prepTime: '',
    isAvailable: true
  })

  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([])

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [menuItemRes, categoriesRes, inventoryRes] = await Promise.all([
        fetch(`/api/menu-items/${params.id}`),
        fetch('/api/categories'),
        fetch('/api/inventory')
      ])

      if (!menuItemRes.ok) {
        throw new Error('Failed to fetch menu item')
      }

      const menuItemData = await menuItemRes.json()
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : []
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : []

      setMenuItem(menuItemData)
      setCategories(categoriesData)
      setInventoryItems(inventoryData)

      // Populate form data
      setFormData({
        name: menuItemData.name,
        categoryId: menuItemData.categoryId,
        description: menuItemData.description || '',
        price: menuItemData.price.toString(),
        prepTime: menuItemData.prepTime?.toString() || '',
        isAvailable: menuItemData.isAvailable
      })

      // Populate selected ingredients
      const ingredients = menuItemData.recipeItems?.map((recipe: any) => ({
        id: recipe.item.id,
        name: recipe.item.name,
        quantity: recipe.quantity,
        unit: recipe.unit,
        cost: recipe.item.costPrice
      })) || []

      setSelectedIngredients(ingredients)
    } catch (error) {
      console.error('Error fetching data:', error)
      showNotification('error', 'Failed to load menu item data', 'Error')
    } finally {
      setLoading(false)
    }
  }

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
    const newIngredient: SelectedIngredient = {
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
    setSaving(true)

    try {
      const response = await fetch(`/api/menu-items/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
          ingredients: selectedIngredients
        })
      })

      if (response.ok) {
        showNotification('success', 'Menu item updated successfully!', 'Success')
        setTimeout(() => {
          router.push('/menu')
        }, 1500)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to update menu item', 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/menu-items/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('success', 'Menu item deleted successfully!', 'Deleted')
        setTimeout(() => {
          router.push('/menu')
        }, 1500)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete menu item', 'Error')
    } finally {
      setDeleting(false)
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

  const availableInventoryItems = inventoryItems.filter(
    item => !selectedIngredients.some(selected => selected.id === item.id)
  )

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Menu Item</h1>
            <p className="mt-2 text-sm text-gray-700">
              Update menu item details, pricing, and ingredients
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete Item'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Chicken Biriyani"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                name="category"
                id="category"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Brief description of the menu item"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Selling Price (BDT) *
              </label>
              <input
                type="number"
                name="price"
                id="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                name="prepTime"
                id="prepTime"
                min="1"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="15"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Available for ordering
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recipe Ingredients</h2>
            <button
              type="button"
              onClick={() => setShowIngredientSelector(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </button>
          </div>

          {selectedIngredients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No ingredients selected. Add ingredients to calculate cost price automatically.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedIngredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{ingredient.name}</h4>
                    <span className="text-sm text-gray-500">{formatCurrency(ingredient.cost)}/{ingredient.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredientQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">{ingredient.unit}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
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
              ))}
            </div>
          )}
        </div>

        {/* Cost Analysis */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Cost Analysis</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cost Price</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(calculateCostPrice())}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Selling Price</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(parseFloat(formData.price) || 0)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-lg font-semibold text-green-600">{calculateProfitMargin()}%</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Ingredient Selector Modal */}
      {showIngredientSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Ingredient</h3>
              <button
                onClick={() => setShowIngredientSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableInventoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addIngredient(item)}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <span className="text-sm text-gray-500">{formatCurrency(item.costPrice)}/{item.unit}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {availableInventoryItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No more ingredients available to add.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
