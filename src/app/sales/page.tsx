import { Plus, DollarSign, TrendingUp, Calendar, Search, Filter, Eye, Download, Receipt } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Get sales data from database
async function getSalesData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const [sales, todayStats] = await Promise.all([
      // Get recent sales with related data
      prisma.sale.findMany({
        include: {
          user: {
            select: {
              name: true
            }
          },
          order: {
            select: {
              orderNumber: true,
              orderType: true,
              customerId: true,
              orderItems: {
                include: {
                  menuItem: {
                    select: {
                      name: true,
                      price: true
                    }
                  },
                  item: {
                    select: {
                      name: true,
                      sellingPrice: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          saleDate: 'desc'
        },
        take: 50
      }),
      // Get today's statistics
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'COMPLETED'
        },
        _count: {
          id: true
        },
        _sum: {
          finalAmount: true
        }
      })
    ]);

    // Calculate additional stats
    const todaySales = sales.filter(sale => 
      sale.saleDate >= today && sale.saleDate < tomorrow && sale.status === 'COMPLETED'
    );
    
    const paymentMethodStats = todaySales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.finalAmount;
      return acc;
    }, {} as Record<string, number>);

    const totalSales = todayStats._sum.finalAmount || 0;
    const totalOrders = todayStats._count.id || 0;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      sales,
      dailyStats: {
        totalSales,
        totalOrders,
        averageOrder,
        cashSales: paymentMethodStats.CASH || 0,
        cardSales: paymentMethodStats.CARD || 0,
        digitalWalletSales: paymentMethodStats.DIGITAL_WALLET || 0,
        bankTransferSales: paymentMethodStats.BANK_TRANSFER || 0
      }
    };
  } catch (error) {
    console.error('Sales data fetch error:', error);
    return {
      sales: [],
      dailyStats: {
        totalSales: 0,
        totalOrders: 0,
        averageOrder: 0,
        cashSales: 0,
        cardSales: 0,
        digitalWalletSales: 0,
        bankTransferSales: 0
      }
    };
  }
}

const paymentMethods = ['All', 'CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER'];

export default async function SalesPage() {
  const { sales, dailyStats } = await getSalesData();
  const totalDigital = dailyStats.cardSales + dailyStats.digitalWalletSales + dailyStats.bankTransferSales;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track daily sales and revenue performance with profit analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/sales/profits"
            className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Profit Analysis
          </Link>
          <Link
            href="/sales/daily"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Daily Sales Per Item
          </Link>
          <Link
            href="/sales/new"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Sale Entry
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">          <div className="flex items-center">            <div className="flex-shrink-0">              <DollarSign className="h-8 w-8 text-green-400" />            </div>            <div className="ml-5 w-0 flex-1">              <dl>                <dt className="truncate text-sm font-medium text-gray-500">Total Sales Today</dt>                <dd className="text-lg font-medium text-gray-900">                  {formatCurrency(dailyStats.totalSales)}                </dd>              </dl>            </div>          </div>          <div className="mt-2">            <div className="flex items-center text-sm text-green-600">              <TrendingUp className="mr-1 h-4 w-4" />              <span>Live data</span>            </div>          </div>        </div>        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">          <div className="flex items-center">            <div className="flex-shrink-0">              <Calendar className="h-8 w-8 text-blue-400" />            </div>            <div className="ml-5 w-0 flex-1">              <dl>                <dt className="truncate text-sm font-medium text-gray-500">Orders Today</dt>                <dd className="text-lg font-medium text-gray-900">{dailyStats.totalOrders}</dd>              </dl>            </div>          </div>        </div>        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">          <div className="flex items-center">            <div className="flex-shrink-0">              <TrendingUp className="h-8 w-8 text-purple-400" />            </div>            <div className="ml-5 w-0 flex-1">              <dl>                <dt className="truncate text-sm font-medium text-gray-500">Average Order</dt>                <dd className="text-lg font-medium text-gray-900">                  {formatCurrency(dailyStats.averageOrder)}                </dd>              </dl>            </div>          </div>        </div>        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">          <div className="flex items-center">            <div className="flex-shrink-0">              <DollarSign className="h-8 w-8 text-yellow-400" />            </div>            <div className="ml-5 w-0 flex-1">              <dl>                <dt className="truncate text-sm font-medium text-gray-500">Cash vs Digital</dt>                <dd className="text-sm font-medium text-gray-900">                  Cash: {formatCurrency(dailyStats.cashSales)}                </dd>                <dd className="text-xs text-gray-500">                  Digital: {formatCurrency(totalDigital)}                </dd>              </dl>            </div>          </div>        </div>      </div>      {/* Payment Method Breakdown */}      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">        <div className="lg:col-span-1">          <div className="overflow-hidden rounded-lg bg-white shadow">            <div className="px-4 py-5 sm:p-6">              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Payment Methods</h3>              <div className="space-y-4">                <div className="flex items-center justify-between">                  <span className="text-sm font-medium text-gray-900">Cash</span>                  <span className="text-sm text-gray-500">{formatCurrency(dailyStats.cashSales)}</span>                </div>                <div className="w-full bg-gray-200 rounded-full h-2">                  <div                     className="bg-green-600 h-2 rounded-full"                     style={{ width: dailyStats.totalSales > 0 ? `${(dailyStats.cashSales / dailyStats.totalSales) * 100}%` : '0%' }}                  ></div>                </div>                <div className="flex items-center justify-between">                  <span className="text-sm font-medium text-gray-900">Card</span>                  <span className="text-sm text-gray-500">{formatCurrency(dailyStats.cardSales)}</span>                </div>                <div className="w-full bg-gray-200 rounded-full h-2">                  <div                     className="bg-blue-600 h-2 rounded-full"                     style={{ width: dailyStats.totalSales > 0 ? `${(dailyStats.cardSales / dailyStats.totalSales) * 100}%` : '0%' }}                  ></div>                </div>                <div className="flex items-center justify-between">                  <span className="text-sm font-medium text-gray-900">Digital Wallet</span>                  <span className="text-sm text-gray-500">{formatCurrency(dailyStats.digitalWalletSales)}</span>                </div>                <div className="w-full bg-gray-200 rounded-full h-2">                  <div                     className="bg-purple-600 h-2 rounded-full"                     style={{ width: dailyStats.totalSales > 0 ? `${(dailyStats.digitalWalletSales / dailyStats.totalSales) * 100}%` : '0%' }}                  ></div>                </div>                {dailyStats.bankTransferSales > 0 && (                  <>                    <div className="flex items-center justify-between">                      <span className="text-sm font-medium text-gray-900">Bank Transfer</span>                      <span className="text-sm text-gray-500">{formatCurrency(dailyStats.bankTransferSales)}</span>                    </div>                    <div className="w-full bg-gray-200 rounded-full h-2">                      <div                         className="bg-indigo-600 h-2 rounded-full"                         style={{ width: dailyStats.totalSales > 0 ? `${(dailyStats.bankTransferSales / dailyStats.totalSales) * 100}%` : '0%' }}                      ></div>                    </div>                  </>                )}              </div>            </div>          </div>        </div>        {/* Recent Sales */}        <div className="lg:col-span-2">          <div className="overflow-hidden rounded-lg bg-white shadow">            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Sales</h3>

              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">                <div className="relative flex-1 max-w-md">                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">                    <Search className="h-5 w-5 text-gray-400" />                  </div>                  <input                    type="text"                    placeholder="Search sales..."                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"                  />                </div>                <div className="flex items-center gap-2">                  <Filter className="h-4 w-4 text-gray-400" />                  <select className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">                    {paymentMethods.map((method) => (                      <option key={method} value={method}>                        {method.replace('_', ' ')}                      </option>                    ))}                  </select>                </div>              </div>              {/* Sales Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Sale Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Payment</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{sale.saleNumber}</div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(sale.saleDate)} • {sale.order?.orderType.replace('_', ' ') || 'Direct Sale'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sale.order?.customerId ? `Customer: ${sale.order.customerId}` : 'Walk-in'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Staff: {sale.user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(sale.finalAmount)}
                          </div>
                          {sale.discountAmount > 0 && (
                            <div className="text-sm text-red-600">
                              -{formatCurrency(sale.discountAmount)} discount
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sale.paymentMethod === 'CASH'
                               ? 'bg-green-100 text-green-800'
                              : sale.paymentMethod === 'CARD'
                              ? 'bg-blue-100 text-blue-800'
                              : sale.paymentMethod === 'DIGITAL_WALLET'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {sale.paymentMethod.replace('_', ' ')}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{sale.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {sales.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No sales found</h3>
                  <p className="mt-1 text-sm text-gray-500">Sales data will appear here once orders are completed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}