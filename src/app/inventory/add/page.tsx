import { Package, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import InventoryForm from './components/InventoryForm'
import { UnitInputGuide } from '../components/UnitInputGuide'
import { QuickAddMultiple } from './components/QuickAddMultiple'

// Get data for adding new items
async function getFormData() {
  try {
    const [categories, suppliers] = await Promise.all([
      prisma.category.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      prisma.supplier.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ])

    return { categories, suppliers }
  } catch (error) {
    console.error('Form data fetch error:', error)
    return { categories: [], suppliers: [] }
  }
}

export default async function AddInventoryItemPage() {
  const { categories, suppliers } = await getFormData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/inventory"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Inventory Item</h1>
          <p className="mt-2 text-gray-600">Create a new inventory item with complete cost and stock tracking</p>
          
          {/* Important Warning */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Important: Stock Management Best Practice</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p><strong>Use this form only for:</strong> Creating new inventory items with initial stock.</p>
                  <p><strong>For adding stock to existing items:</strong> Use <Link href="/admin/purchases/new" className="font-medium underline">Purchase Orders</Link> instead to avoid double counting.</p>
                  <p><strong>Current workflow:</strong> Purchase Order → Receive Stock → Stock Updates Automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Input Guide */}
        <UnitInputGuide />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Item Details</h2>
            </div>
          </div>
          
          <div className="p-6">
            <InventoryForm categories={categories} suppliers={suppliers} />
          </div>
        </div>

        {/* Quick Add Multiple Section */}
        <QuickAddMultiple categories={categories} suppliers={suppliers} />
      </div>
    </div>
  )
}
