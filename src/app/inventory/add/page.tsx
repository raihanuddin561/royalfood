import { Package, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
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
