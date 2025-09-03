'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PeriodSummaryProps {
  period: 'weekly' | 'monthly' | 'yearly'
}

interface PeriodData {
  revenue: number
  expenses: number
  profit: number
  trend: number
  days: number
}

export default function PeriodCostSummary({ period }: PeriodSummaryProps) {
  const [data, setData] = useState<PeriodData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPeriodData()
  }, [period])

  const loadPeriodData = async () => {
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      // Calculate date ranges
      switch (period) {
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1)
          break
        case 'yearly':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Load profit analysis for the period
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      const response = await fetch(`/api/profit-analysis?${params}`)
      if (response.ok) {
        const result = await response.json()
        
        // Calculate trend (compare with previous period)
        const prevEndDate = new Date(startDate)
        const prevStartDate = new Date(startDate)
        
        switch (period) {
          case 'weekly':
            prevStartDate.setDate(prevStartDate.getDate() - 7)
            break
          case 'monthly':
            prevStartDate.setMonth(prevStartDate.getMonth() - 1)
            break
          case 'yearly':
            prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
            break
        }

        const prevParams = new URLSearchParams({
          startDate: prevStartDate.toISOString(),
          endDate: prevEndDate.toISOString()
        })
        
        const prevResponse = await fetch(`/api/profit-analysis?${prevParams}`)
        let trend = 0
        
        if (prevResponse.ok) {
          const prevResult = await prevResponse.json()
          const currentProfit = result.summary?.netProfit || 0
          const prevProfit = prevResult.summary?.netProfit || 0
          
          if (prevProfit > 0) {
            trend = ((currentProfit - prevProfit) / prevProfit) * 100
          }
        }

        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        setData({
          revenue: result.summary?.totalRevenue || 0,
          expenses: result.summary?.effectiveTotalExpenses || 0,
          profit: result.summary?.netProfit || 0,
          trend,
          days
        })
      }
    } catch (error) {
      console.error(`Error loading ${period} data:`, error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-center text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>No data available</p>
        </div>
      </div>
    )
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'weekly': return 'Last 7 Days'
      case 'monthly': return 'Last 30 Days'
      case 'yearly': return 'Last 12 Months'
    }
  }

  const getPeriodColor = () => {
    switch (period) {
      case 'weekly': return 'blue'
      case 'monthly': return 'green'
      case 'yearly': return 'purple'
    }
  }

  const color = getPeriodColor()

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">{getPeriodLabel()}</h4>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' : 
          'bg-purple-100'
        }`}>
          <Calendar className={`w-5 h-5 ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            'text-purple-600'
          }`} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Revenue</span>
          <span className="font-semibold text-green-600">{formatCurrency(data.revenue)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Expenses</span>
          <span className="font-semibold text-red-600">{formatCurrency(data.expenses)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-900">Net Profit</span>
            <span className={`font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.profit)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">vs previous {period}</span>
          <div className={`flex items-center ${data.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.trend >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(data.trend).toFixed(1)}%
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Daily avg: {formatCurrency(data.days > 0 ? data.profit / data.days : 0)}
        </div>
      </div>
    </div>
  )
}
