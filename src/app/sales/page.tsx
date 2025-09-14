'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Receipt,
  CreditCard,
  Users,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart,
  Eye
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency-config'
import { toast } from 'sonner'
import Link from 'next/link'

interface Sale {
  id: string
  saleNumber: string
  saleDate: string
  totalAmount: number
  paymentMethod: string
  status: string
  customer?: {
    name: string
    phone: string
  }
  user: {
    name: string
  }
  order?: {
    orderNumber: string
    orderType: string
    orderItems: Array<{
      menuItem?: {
        name: string
      }
    }>
  }
  menuItemSales: Array<{
    quantity: number
    totalPrice: number
    grossProfit: number
    menuItem: {
      name: string
    }
  }>
}

interface SalesData {
  sales: Sale[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  todayStats: {
    todayRevenue: number
    todayTransactions: number
    servedOrders: number
    pendingSalesRecords: number
  }
  summary: {
    totalRevenue: number
    totalTransactions: number
    averageOrderValue: number
    totalTax: number
    totalDeliveryFees: number
    paymentBreakdown: Array<{
      paymentMethod: string
      _sum: { totalAmount: number }
      _count: number
    }>
  }
}

export default function SalesPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    search: ''
  })

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod)
      
      const response = await fetch(`/api/sales?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setSalesData(data.data)
      } else {
        toast.error('Failed to load sales data')
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast.error('Error loading sales data')
    } finally {
      setLoading(false)
    }
  }

  const syncPendingSales = async () => {
    try {
      const response = await fetch('/api/sales/sync-pending', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Synced ${data.recordsCreated} sales records`)
        fetchSalesData()
      } else {
        toast.error('Failed to sync sales records')
      }
    } catch (error) {
      toast.error('Error syncing sales records')
    }
  }

  const exportSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod)
      
      const response = await fetch(`/api/sales/export?${params.toString()}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Sales report exported successfully')
    } catch (error) {
      toast.error('Failed to export sales report')
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSalesData()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [filters])

  if (loading && !salesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-gray-600 mt-1">
            Track revenue, transactions, and sales performance
          </p>
        </div>
        <div className="flex gap-2">
          {salesData?.todayStats.pendingSalesRecords && salesData.todayStats.pendingSalesRecords > 0 && (
            <Button onClick={syncPendingSales} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Sync {salesData.todayStats.pendingSalesRecords} Pending
            </Button>
          )}
          <Button onClick={exportSales} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/sales/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.todayStats.todayRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {salesData.todayStats.todayTransactions} transactions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {salesData.summary.totalTransactions} total transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.summary.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                Per transaction average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.summary.totalTax)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(salesData.summary.totalDeliveryFees)} delivery fees
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({ startDate: '', endDate: '', paymentMethod: '', search: '' })}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {salesData?.summary.paymentBreakdown && salesData.summary.paymentBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Payment Method Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {salesData.summary.paymentBreakdown.map((payment) => (
                  <div key={payment.paymentMethod} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {payment.paymentMethod.replace('_', ' ')}
                    </div>
                    <div className="text-xl font-bold">{formatCurrency(payment._sum.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{payment._count} transactions</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>
                {salesData ? `${salesData.pagination.total} total sales` : 'Loading sales...'}
              </CardDescription>
            </div>
            {loading && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {salesData?.sales && salesData.sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Sale #</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Items</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{sale.saleNumber}</div>
                        {sale.order?.orderNumber && (
                          <div className="text-xs text-gray-500">Order: {sale.order.orderNumber}</div>
                        )}
                      </td>
                      <td className="p-2">
                        <div>{new Date(sale.saleDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.saleDate).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-2">
                        {sale.customer ? (
                          <div>
                            <div className="font-medium">{sale.customer.name}</div>
                            <div className="text-xs text-gray-500">{sale.customer.phone}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Guest</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {sale.menuItemSales.length > 0 ? (
                            sale.menuItemSales.slice(0, 2).map((item, idx) => (
                              <div key={idx}>
                                {item.quantity}x {item.menuItem.name}
                              </div>
                            ))
                          ) : sale.order?.orderItems ? (
                            sale.order.orderItems.slice(0, 2).map((item, idx) => (
                              <div key={idx}>
                                {item.menuItem?.name || 'Item'}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">No items</span>
                          )}
                          {(sale.menuItemSales.length > 2 || (sale.order?.orderItems && sale.order.orderItems.length > 2)) && (
                            <div className="text-xs text-gray-500">
                              +{Math.max(sale.menuItemSales.length - 2, (sale.order?.orderItems?.length || 0) - 2)} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {sale.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="font-semibold">{formatCurrency(sale.totalAmount)}</div>
                        {sale.menuItemSales.length > 0 && (
                          <div className="text-xs text-green-600">
                            Profit: {formatCurrency(sale.menuItemSales.reduce((sum, item) => sum + item.grossProfit, 0))}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No sales found</h3>
              <p className="text-gray-500 mb-4">
                {filters.startDate || filters.endDate ? 
                  'No sales match your filter criteria' : 
                  'No sales have been recorded yet'
                }
              </p>
              <Link href="/sales/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Sale
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}