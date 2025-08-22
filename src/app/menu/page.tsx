import { Plus, Search, Filter, Edit, Trash2, Eye, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Get menu data from database
async function getMenuData() {
  try {
    const [menuItems, categories] = await Promise.all([
      prisma.menuItem.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.category.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ])

    return { menuItems, categories }
  } catch (error) {
    console.error('Menu data fetch error:', error)
    return { menuItems: [], categories: [] }
  }
}

export default async function MenuPage() {
  const { menuItems, categories } = await getMenuData()

  const menuStats = {
    total: menuItems.length,
    available: menuItems.filter(item => item.isAvailable).length,
    avgPrice: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0,
    avgMargin: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + ((item.price - item.costPrice) / item.price * 100), 0) / menuItems.length : 0
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
        <Link
          href="/menu/add"
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <select className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {menuItems.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {/* Image Placeholder */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <div className="flex items-center justify-center h-48 bg-gray-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
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
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  {item.category.name}
                </span>
                
                <div className="flex items-center space-x-2">
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
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete Item"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                        // TODO: Implement delete functionality
                        alert('Delete functionality will be implemented')
                      }
                    }}
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
      {menuItems.length === 0 && (
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
        </div>
      )}
    </div>
  )
}
