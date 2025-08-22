import { Plus, Edit, Trash2, ArrowLeft, Save, Tag, Package, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { createCategory, updateCategory, toggleCategoryStatus, deleteCategory } from '@/app/actions/categories'
import Link from 'next/link'
import { CategoryForm } from './components/CategoryForm'
import { CategoryActions } from './components/CategoryActions'

// Get categories data
async function getCategoriesData() {
  try {
    const [categories, categoryStats] = await Promise.all([
      // Get all categories
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              items: {
                where: {
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      }),
      
      // Get category statistics
      prisma.category.aggregate({
        _count: {
          id: true
        },
        where: {
          isActive: true
        }
      })
    ])

    return {
      categories,
      stats: {
        totalCategories: categoryStats._count.id,
        activeCategories: categories.filter(c => c.isActive).length,
        inactiveCategories: categories.filter(c => !c.isActive).length,
        totalItems: categories.reduce((sum, cat) => sum + cat._count.items, 0)
      }
    }
  } catch (error) {
    console.error('Categories data fetch error:', error)
    return {
      categories: [],
      stats: {
        totalCategories: 0,
        activeCategories: 0,
        inactiveCategories: 0,
        totalItems: 0
      }
    }
  }
}

export default async function CategoriesPage() {
  const { categories, stats } = await getCategoriesData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/inventory"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="mt-2 text-gray-600">Manage inventory categories for better organization and reporting</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                <p className="text-xs text-gray-500 mt-1">All categories</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCategories}</p>
                <p className="text-xs text-gray-500 mt-1">Currently in use</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalItems}</p>
                <p className="text-xs text-gray-500 mt-1">Items across all categories</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Categories</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactiveCategories}</p>
                <p className="text-xs text-gray-500 mt-1">Disabled categories</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Category Form */}
          <div className="lg:col-span-1">
            <CategoryForm />
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
                <p className="text-sm text-gray-600 mt-1">Manage existing categories and their status</p>
              </div>
              
              <div className="p-6">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-500 mb-4">Start by creating your first inventory category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{category.description || 'No description'}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{category._count.items} items</span>
                              <span>Created {formatDateTime(category.createdAt)}</span>
                              {category.updatedAt !== category.createdAt && (
                                <span>Updated {formatDateTime(category.updatedAt)}</span>
                              )}
                            </div>
                          </div>
                          <CategoryActions category={category} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600 mt-1">Common category management tasks</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/inventory/add"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <Package className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add Inventory Item</h3>
                  <p className="text-xs text-gray-600">Create items using your categories</p>
                </div>
              </Link>
              
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                <Tag className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Bulk Import Categories</h3>
                  <p className="text-xs text-gray-600">Import multiple categories from CSV</p>
                </div>
              </button>
              
              <Link
                href="/inventory"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
              >
                <Package className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">View Inventory</h3>
                  <p className="text-xs text-gray-600">See items organized by category</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
