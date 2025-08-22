import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

// Get dashboard data from database
async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    // Get today's orders and sales
    const [
      todayOrders,
      todaySales,
      lowStockItems,
      activeEmployees,
      recentOrders,
      monthlyData
    ] = await Promise.all([
      // Today's orders count
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Today's sales total
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),
      
      // Low stock items
      prisma.item.findMany({
        where: {
          AND: [
            {
              currentStock: {
                lte: 5 // Items with 5 or less stock
              }
            },
            {
              isActive: true
            }
          ]
        },
        select: {
          name: true,
          currentStock: true,
          reorderLevel: true,
          unit: true
        },
        take: 10
      }),
      
      // Active employees count
      prisma.employee.count({
        where: {
          isActive: true
        }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 4,
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
      }),
      
      // Monthly data for partnership
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      })
    ])

    return {
      todayOrders,
      todayRevenue: todaySales._sum.finalAmount || 0,
      lowStockItems,
      activeEmployees,
      recentOrders,
      monthlyRevenue: monthlyData._sum.finalAmount || 0
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    // Return default data if database fails
    return {
      todayOrders: 0,
      todayRevenue: 0,
      lowStockItems: [],
      activeEmployees: 0,
      recentOrders: [],
      monthlyRevenue: 0
    }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const stats = [
    {
      name: 'Total Revenue Today',
      value: formatCurrency(data.todayRevenue),
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: DollarSign,
    },
    {
      name: 'Orders Today', 
      value: data.todayOrders.toString(),
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: ShoppingCart,
    },
    {
      name: 'Low Stock Items',
      value: data.lowStockItems.length.toString(),
      change: `${data.lowStockItems.length} items`,
      changeType: 'decrease' as const,
      icon: Package,
    },
    {
      name: 'Active Employees',
      value: data.activeEmployees.toString(),
      change: '0%',
      changeType: 'neutral' as const,
      icon: Users,
    },
  ]

  const recentOrders = data.recentOrders.map(order => ({
    id: order.orderNumber,
    customer: order.customerId || order.user?.name || 'Walk-in',
    amount: formatCurrency(order.finalAmount),
    status: order.status.replace('_', ' '), // Convert DINE_IN to DINE IN
    time: formatDateTime(order.createdAt)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of your Royal Food restaurant operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div
                className={`flex items-center text-sm ${
                  stat.changeType === 'increase'
                    ? 'text-green-600'
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : stat.changeType === 'decrease' ? (
                  <TrendingDown className="mr-1 h-4 w-4" />
                ) : null}
                <span>{stat.change}</span>
              </div>
              <span className="ml-2 text-sm text-gray-500">from yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{order.amount}</p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'PREPARING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'READY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">{order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">Low Stock Alert</h3>
            </div>
            <div className="space-y-4">
              {data.lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Reorder level: {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {item.currentStock} {item.unit}
                    </p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Summary */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Partnership Summary (This Month)</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.monthlyRevenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.monthlyRevenue * 0.66)}</p>
              <p className="text-sm text-gray-500">Est. Total Expenses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.monthlyRevenue * 0.34)}</p>
              <p className="text-sm text-gray-500">Est. Net Profit</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">Partner A (60%)</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency((data.monthlyRevenue * 0.34) * 0.6)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">Partner B (40%)</p>
              <p className="text-lg font-bold text-green-900">{formatCurrency((data.monthlyRevenue * 0.34) * 0.4)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
