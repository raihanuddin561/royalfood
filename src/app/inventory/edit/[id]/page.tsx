import { Package, ArrowLeft, Save } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditInventoryForm } from './components/EditInventoryForm'

// Get data for editing item
async function getEditItemData(itemId: string) {
  try {
    const [item, categories, suppliers] = await Promise.all([
      prisma.item.findUnique({
        where: { id: itemId },
        include: {
          category: true,
          supplier: true,
          inventoryLogs: {
            take: 10,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      
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

    return { item, categories, suppliers }
  } catch (error) {
    console.error('Edit item data fetch error:', error)
    return { item: null, categories: [], suppliers: [] }
  }
}

interface EditInventoryPageProps {
  params: {
    id: string
  }
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
  const { item, categories, suppliers } = await getEditItemData(params.id)

  if (!item) {
    notFound()
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Inventory Item</h1>
          <p className="mt-2 text-gray-600">Update item details, pricing, and stock information</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Edit: {item.name}</h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-500">
                  SKU: {item.sku}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <EditInventoryForm 
              item={item as any} 
              categories={categories} 
              suppliers={suppliers} 
            />
          </div>
        </div>

        {/* Item History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {item.inventoryLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity recorded for this item</p>
            ) : (
              <div className="space-y-4">
                {item.inventoryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.type === 'STOCK_IN' 
                          ? 'bg-green-100 text-green-600' 
                          : log.type === 'STOCK_OUT' 
                            ? 'bg-red-100 text-red-600' 
                            : log.type === 'WASTE'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-blue-100 text-blue-600'
                      }`}>
                        {log.type === 'STOCK_IN' ? '+' : log.type === 'STOCK_OUT' ? '-' : '~'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.type === 'STOCK_IN' && 'Stock Added'}
                          {log.type === 'STOCK_OUT' && 'Stock Used'}
                          {log.type === 'WASTE' && 'Waste Recorded'}
                          {log.type === 'ADJUSTMENT' && 'Stock Adjusted'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.abs(log.quantity)} {(item as any).unit}
                          {log.user && ` by ${log.user.name}`}
                          {log.reason && ` - ${log.reason}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
