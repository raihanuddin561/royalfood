'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ShoppingCartIcon, PackageIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-react'
import { format } from 'date-fns'

interface SummaryData {
  success: boolean
  dateRange: {
    start: string
    end: string
    period: string
  }
  summary: {
    totalSales: number
    totalPurchases: number
    totalExpenses: number
    totalUsageCost: number
    totalProfit: number
    totalInventoryValue: number
    profitMargin: number
    outOfStockItems: number
    lowStockItems: number
    totalTransactions: number
    avgTransactionValue: number
  }
  dailyData: {
    sales: any[]
    purchases: any[]
    stockUsage: any[]
    expenses: any[]
    profits: any[]
  }
  inventory: any[]
}

export default function ComprehensiveSummary() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('last_30_days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url = `/api/summary?period=${period}`
      if (period === 'custom' && startDate && endDate) {
        url = `/api/summary?startDate=${startDate}&endDate=${endDate}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch summary')
      }
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [period, startDate, endDate])

  const formatCurrency = (amount: number | string | null | undefined) => {
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount as number) || numAmount === null || numAmount === undefined) {
        return '৳0.00';
      }
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 2
      }).format(numAmount as number).replace('BDT', '৳');
    } catch (error) {
      console.warn('Currency formatting error:', error, 'Input:', amount);
      return '৳0.00';
    }
  }

  const formatDate = (dateString: string | Date) => {
    try {
      // Handle different date input types
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Check if it's already a valid date string
        date = new Date(dateString);
      } else {
        throw new Error('Invalid date input');
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Date formatting error:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK': return 'destructive'
      case 'LOW_STOCK': return 'secondary'
      case 'IN_STOCK': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK': return <XCircleIcon className="h-4 w-4" />
      case 'LOW_STOCK': return <AlertTriangleIcon className="h-4 w-4" />
      case 'IN_STOCK': return <CheckCircleIcon className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading comprehensive summary...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <XCircleIcon className="h-5 w-5" />
              <span className="font-medium">Error Loading Summary</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button onClick={fetchSummary} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 Business Summary</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {data?.dateRange?.start && data?.dateRange?.end ? (
                    <>Complete overview from {formatDate(data.dateRange.start)} to {formatDate(data.dateRange.end)}</>
                  ) : (
                    <>Loading date range...</>
                  )}
                </p>
              </div>
              
              {/* Period Selection */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {period === 'custom' && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
          )}
          
          <Button 
            onClick={fetchSummary} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">💰 Total Sales Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalSales)}</p>
                <p className="text-xs text-gray-500">{data.summary.totalTransactions} customer transactions</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">📈 Net Profit/Loss</p>
                <p className={`text-2xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.summary.totalProfit)}
                </p>
                <p className="text-xs text-gray-500">{data.summary.profitMargin.toFixed(2)}% profit margin</p>
              </div>
              {data.summary.totalProfit >= 0 ? 
                <TrendingUpIcon className="h-8 w-8 text-green-600" /> :
                <TrendingDownIcon className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">💸 Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.totalExpenses)}</p>
                <p className="text-xs text-gray-500">All operating costs</p>
              </div>
              <TrendingDownIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">📦 Inventory Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.summary.totalInventoryValue)}</p>
                <p className="text-xs text-gray-500">
                  {data.summary.outOfStockItems > 0 && (
                    <span className="text-red-500">{data.summary.outOfStockItems} out of stock</span>
                  )}
                  {data.summary.lowStockItems > 0 && (
                    <span className="text-yellow-500 ml-1">{data.summary.lowStockItems} low stock</span>
                  )}
                  {data.summary.outOfStockItems === 0 && data.summary.lowStockItems === 0 && (
                    <span className="text-green-500">All items in stock</span>
                  )}
                </p>
              </div>
              <PackageIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="daily">📅 Daily View</TabsTrigger>
          <TabsTrigger value="sales">💰 Sales</TabsTrigger>
          <TabsTrigger value="purchases">🛒 Purchases</TabsTrigger>
          <TabsTrigger value="expenses">💸 Expenses</TabsTrigger>
          <TabsTrigger value="inventory">📦 Inventory</TabsTrigger>
          <TabsTrigger value="profits">📈 Stock Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Business Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This overview shows how your business performed during the selected period. 
                It includes key metrics that help you understand your revenue, costs, and profitability.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Transaction Value</span>
                  <span className="font-bold">{formatCurrency(data.summary.avgTransactionValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Purchases</span>
                  <span className="font-bold">{formatCurrency(data.summary.totalPurchases)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Stock Usage Cost</span>
                  <span className="font-bold">{formatCurrency(data.summary.totalUsageCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <Badge variant={data.summary.profitMargin > 20 ? "default" : "secondary"}>
                    {data.summary.profitMargin.toFixed(2)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Status Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                  <Badge variant="destructive">{data.summary.outOfStockItems} items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-600">Low Stock</span>
                  <Badge variant="secondary">{data.summary.lowStockItems} items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">Total Inventory Value</span>
                  <span className="font-bold">{formatCurrency(data.summary.totalInventoryValue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.dailyData.profits.map((day: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="text-sm">{formatDate(day.date)}</span>
                    <div className="flex gap-4 text-sm">
                      <span>Revenue: {formatCurrency(day.revenue)}</span>
                      <span className={day.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Profit: {formatCurrency(day.net_profit)}
                      </span>
                      <span>Margin: {day.net_margin.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Comprehensive View Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📅 Daily Operations Overview - Complete Business Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Complete daily business operations in a single view. See sales, purchases, expenses, stock usage, and profit calculations for each date.
                This comprehensive view helps you understand the complete business flow and profitability day by day.
              </p>
              
              {/* Table Header */}
              <div className="overflow-x-auto">
                <div className="min-w-full bg-gray-50 rounded-lg p-2">
                  <div className="hidden xl:grid xl:grid-cols-12 gap-1 font-semibold text-xs text-gray-700 p-2 border-b">
                    <div>📅 Date</div>
                    <div className="text-center">💰 Sales</div>
                    <div className="text-center">👥 Payroll</div>
                    <div className="text-center">⚡ Utilities</div>
                    <div className="text-center">🏢 Rent</div>
                    <div className="text-center">📦 Stock Cost</div>
                    <div className="text-center">⚙️ Operations</div>
                    <div className="text-center">🛒 Purchases</div>
                    <div className="text-center">💸 Total Costs</div>
                    <div className="text-center">🏆 Gross Profit</div>
                    <div className="text-center">📊 Net Profit</div>
                    <div className="text-center">📈 Margin %</div>
                  </div>
                  
                  {/* Simplified header for smaller screens */}
                  <div className="xl:hidden grid grid-cols-5 gap-2 font-semibold text-xs text-gray-700 p-2 border-b">
                    <div>📅 Date</div>
                    <div className="text-center">💰 Sales</div>
                    <div className="text-center">💸 Total Costs</div>
                    <div className="text-center">📊 Net Profit</div>
                    <div className="text-center">📈 Margin</div>
                  </div>
                  
                  {/* Daily Data Rows */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.dailyData.profits.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No daily data found for the selected period
                      </div>
                    ) : (
                      data.dailyData.profits.map((day: any, index: number) => {
                        // Find corresponding data from other arrays
                        const salesData = data.dailyData.sales.find((s: any) => 
                          formatDate(s.date) === formatDate(day.date)
                        ) || { transaction_count: 0, final_amount: 0, cash_amount: 0, card_amount: 0, digital_amount: 0 }
                        
                        const purchaseData = data.dailyData.purchases.find((p: any) => 
                          formatDate(p.date) === formatDate(day.date)
                        ) || { purchase_count: 0, total_purchase_amount: 0 }
                        
                        const expenseData = data.dailyData.expenses.find((e: any) => 
                          formatDate(e.date) === formatDate(day.date)
                        ) || { expense_count: 0, total_expenses: 0 }
                        
                        const stockData = data.dailyData.stockUsage.find((su: any) => 
                          formatDate(su.date) === formatDate(day.date)
                        ) || { usage_entries: 0, total_usage_cost: 0 }
                        
                        const revenue = Number(day.revenue || 0)
                        const cogs = Number(day.cogs || 0)
                        const expenses = Number(day.expenses || 0)
                        
                        // Calculate total costs including all categories
                        const payrollCost = Number(expenseData.payroll_expenses || 0)
                        const utilitiesCost = Number(expenseData.utilities_expenses || 0)
                        const rentCost = Number(expenseData.rent_expenses || 0)
                        const stockCost = Number(stockData.total_usage_cost || 0)
                        const operationalCost = Number(expenseData.operational_expenses || 0)
                        const otherCosts = Number(expenseData.other_expenses || 0)
                        const purchaseCost = Number(purchaseData.total_purchase_amount || 0)
                        
                        // CORRECT PROFIT CALCULATION: Sales - ALL COSTS
                        const totalDailyCosts = payrollCost + utilitiesCost + rentCost + stockCost + operationalCost + otherCosts
                        const grossProfit = revenue - stockCost // Revenue minus stock usage cost
                        const netProfit = revenue - totalDailyCosts // Revenue minus ALL costs (including stock)
                        const netMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0
                        
                        return (
                          <div key={index} className="lg:grid lg:grid-cols-8 gap-2 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                            {/* Mobile Layout - Detailed Card */}
                            <div className="xl:hidden space-y-3">
                              <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="font-medium text-lg">{formatDate(day.date)}</h4>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">{formatCurrency(netProfit)}</p>
                                  <p className="text-xs text-gray-500">{netMargin.toFixed(1)}% margin</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex justify-between bg-green-50 p-2 rounded">
                                  <span className="text-gray-600">💰 Sales Revenue:</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(revenue)} ({salesData.transaction_count} transactions)
                                  </span>
                                </div>
                                
                                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                  <div className="font-medium mb-1">📊 Daily Cost Breakdown:</div>
                                  <div className="grid grid-cols-2 gap-1">
                                    <div>👥 Payroll: <strong>{formatCurrency(payrollCost)}</strong></div>
                                    <div>⚡ Utilities: <strong>{formatCurrency(utilitiesCost)}</strong></div>
                                    <div>🏢 Rent: <strong>{formatCurrency(rentCost)}</strong></div>
                                    <div>📦 Stock Used: <strong>{formatCurrency(stockCost)}</strong></div>
                                    <div>⚙️ Operations: <strong>{formatCurrency(operationalCost)}</strong></div>
                                    <div>🛒 Purchases: <strong>{formatCurrency(purchaseCost)}</strong></div>
                                  </div>
                                  <div className="border-t mt-1 pt-1 font-medium">
                                    💸 Total Costs: <strong>{formatCurrency(totalDailyCosts)}</strong>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between bg-blue-50 p-2 rounded">
                                  <span className="text-gray-600">🏆 Gross Profit (Revenue - COGS):</span>
                                  <span className="font-medium text-emerald-600">{formatCurrency(grossProfit)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Desktop Layout - Detailed View */}
                            <div className="hidden xl:contents">
                              <div className="flex items-center">
                                <span className="font-medium text-sm">{formatDate(day.date)}</span>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-green-600 text-sm">{formatCurrency(revenue)}</p>
                                <p className="text-xs text-gray-500">{salesData.transaction_count} trans</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-blue-600 text-sm">{formatCurrency(payrollCost)}</p>
                                <p className="text-xs text-gray-500">Staff costs</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-yellow-600 text-sm">{formatCurrency(utilitiesCost)}</p>
                                <p className="text-xs text-gray-500">Electric/Gas</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-purple-600 text-sm">{formatCurrency(rentCost)}</p>
                                <p className="text-xs text-gray-500">Facility</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-orange-600 text-sm">{formatCurrency(stockCost)}</p>
                                <p className="text-xs text-gray-500">{stockData.usage_entries} uses</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-indigo-600 text-sm">{formatCurrency(operationalCost)}</p>
                                <p className="text-xs text-gray-500">Operations</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-cyan-600 text-sm">{formatCurrency(purchaseCost)}</p>
                                <p className="text-xs text-gray-500">{purchaseData.purchase_count} orders</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-red-600 text-sm">{formatCurrency(totalDailyCosts)}</p>
                                <p className="text-xs text-gray-500">All costs</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="font-bold text-emerald-600 text-sm">{formatCurrency(grossProfit)}</p>
                                <p className="text-xs text-gray-500">Revenue-COGS</p>
                              </div>
                              
                              <div className="text-center">
                                <p className={`font-bold text-sm ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(netProfit)}
                                </p>
                                <p className="text-xs text-gray-500">After all costs</p>
                              </div>
                              
                              <div className="text-center">
                                <p className={`font-bold text-sm ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {netMargin.toFixed(1)}%
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                  <div 
                                    className={`h-1 rounded-full ${netMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(Math.abs(netMargin), 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Simplified Layout for smaller screens */}
                            <div className="xl:hidden grid grid-cols-5 gap-2 text-center items-center">
                              <div className="text-left">
                                <span className="font-medium text-sm">{formatDate(day.date)}</span>
                              </div>
                              <div>
                                <p className="font-bold text-green-600 text-sm">{formatCurrency(revenue)}</p>
                                <p className="text-xs text-gray-500">{salesData.transaction_count}</p>
                              </div>
                              <div>
                                <p className="font-bold text-red-600 text-sm">{formatCurrency(totalDailyCosts)}</p>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(netProfit)}
                                </p>
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {netMargin.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              
              {/* Summary Footer */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Period Summary</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-blue-600 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalSales)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-600 font-medium">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.summary.totalExpenses)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-600 font-medium">Net Profit</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalProfit)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-600 font-medium">Profit Margin</p>
                    <p className="text-xl font-bold text-blue-600">{data.summary.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💰 Daily Sales Revenue Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track how much revenue was generated each day through customer transactions. 
                This shows your daily income broken down by payment methods.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.dailyData.sales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data found for the selected period
                  </div>
                ) : (
                  data.dailyData.sales.map((day: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-medium text-lg">{formatDate(day.date)}</h4>
                          <p className="text-sm text-gray-600">
                            <strong>{day.transaction_count}</strong> customer transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-green-600">{formatCurrency(day.final_amount)}</p>
                          <p className="text-sm text-gray-600">
                            Avg per transaction: <strong>{formatCurrency(day.avg_transaction_value)}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">💵 Cash:</span>
                          <span className="font-medium">{formatCurrency(day.cash_amount)} ({day.cash_transactions})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">💳 Card:</span>
                          <span className="font-medium">{formatCurrency(day.card_amount)} ({day.card_transactions})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">📱 Digital:</span>
                          <span className="font-medium">{formatCurrency(day.digital_amount)} ({day.digital_transactions})</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🛒 Daily Purchase Orders & Inventory Restocking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track daily inventory purchases and restocking activities. This shows how much you spent 
                on ingredients and supplies to keep your restaurant running.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.dailyData.purchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No purchase orders found for the selected period
                  </div>
                ) : (
                  data.dailyData.purchases.map((day: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-medium text-lg">{formatDate(day.date)}</h4>
                          <p className="text-sm text-gray-600">
                            <strong>{day.purchase_count}</strong> purchase orders placed
                          </p>
                          <p className="text-xs text-blue-600">
                            📦 Suppliers: <strong>{day.suppliers || 'Various'}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-blue-600">{formatCurrency(day.total_purchase_amount)}</p>
                          <p className="text-sm text-green-600">✅ Paid: {formatCurrency(day.total_paid)}</p>
                          <p className="text-sm text-red-600">⏳ Outstanding: {formatCurrency(day.outstanding_amount)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          {day.completed_purchases} orders received
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {day.pending_purchases} orders pending
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💸 Daily Expenses & Operational Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Monitor all business expenses including utilities, rent, maintenance, supplies, and operational costs. 
                Track spending patterns to optimize cost management and improve profitability.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.dailyData.expenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No expense records found for the selected period
                  </div>
                ) : (
                  data.dailyData.expenses.map((day: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-medium text-lg">{formatDate(day.date)}</h4>
                          <p className="text-sm text-gray-600">
                            <strong>{day.expense_count}</strong> expense transactions recorded
                          </p>
                          <p className="text-xs text-red-600">
                            💰 Business operational costs and investments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-red-600">{formatCurrency(day.total_expenses)}</p>
                          <p className="text-sm text-gray-600">📊 Daily expense total</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">👥 Payroll:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(day.payroll_expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">⚡ Utilities:</span>
                          <span className="font-medium text-yellow-600">{formatCurrency(day.utilities_expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">🏢 Rent:</span>
                          <span className="font-medium text-purple-600">{formatCurrency(day.rent_expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">⚙️ Operational:</span>
                          <span className="font-medium text-green-600">{formatCurrency(day.operational_expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">📦 Stock:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(day.stock_expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">📝 Other:</span>
                          <span className="font-medium text-gray-600">{formatCurrency(day.other_expenses)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✅ {day.paid_count} paid
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          ⏳ {day.approved_count} approved
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          ⌛ {day.pending_count} pending
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📦 Current Inventory Status & Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Monitor current stock levels, identify low inventory items, and track stock status across all ingredients and supplies. 
                Ensure adequate inventory to meet operational demands and prevent stockouts.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.inventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No inventory items found
                  </div>
                ) : (
                  data.inventory.map((item: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            📂 Category: <strong>{item.category}</strong>
                          </p>
                          <p className="text-xs text-blue-600">
                            📊 Current Stock: <strong>{item.current_quantity || item.currentStock}</strong> {item.unit}
                          </p>
                          <p className="text-xs text-orange-600">
                            💰 Value: <strong>{formatCurrency(item.current_value || item.inventory_value)}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={getStatusColor(item.status || item.stock_status)} 
                            className="mb-2"
                          >
                            {getStatusIcon(item.status || item.stock_status)} {(item.status || item.stock_status).replace('_', ' ')}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            ⚠️ Min Level: <strong>{item.min_stock_level || item.reorderLevel}</strong> {item.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Usage Tab */}
        <TabsContent value="profits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 Daily Stock Usage & Ingredient Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track how ingredients and supplies were consumed daily. This shows the cost of ingredients 
                used in food production, waste management, and sampling activities.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.dailyData.stockUsage.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No stock usage records found for the selected period
                  </div>
                ) : (
                  data.dailyData.stockUsage.map((day: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-medium text-lg">{formatDate(day.date)}</h4>
                          <p className="text-sm text-gray-600">
                            <strong>{day.usage_entries}</strong> ingredient usage entries
                          </p>
                          <p className="text-xs text-blue-600">
                            📦 Items consumed: <strong>{day.items_used}</strong> different ingredients
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-orange-600">{formatCurrency(day.total_usage_cost)}</p>
                          <p className="text-sm text-gray-600">
                            📊 Total quantity: <strong>{day.total_quantity_used}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">🍳 Production:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(day.production_cost)} ({day.production_entries})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">🗑️ Waste:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(day.waste_cost)} ({day.waste_entries})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">🧪 Sample:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(day.sample_cost)} ({day.sample_entries})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
