'use client'

import { useState } from 'react'
import { Users, TrendingUp, DollarSign, Calendar, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency, formatDate, calculatePercentage } from '@/lib/utils'

// Mock partnership data
const partners = [
  {
    id: '1',
    name: 'Partner A',
    sharePercent: 60,
    email: 'partnera@restaurant.com',
    phone: '+880 1711 111111',
    joinDate: new Date('2023-01-01'),
    totalInvestment: 500000
  },
  {
    id: '2',
    name: 'Partner B',
    sharePercent: 40,
    email: 'partnerb@restaurant.com',
    phone: '+880 1712 222222',
    joinDate: new Date('2023-01-01'),
    totalInvestment: 300000
  }
]

// Mock financial data for current month
const monthlyData = {
  revenue: 125000,
  expenses: {
    foodCost: 45000,
    employeeSalary: 35000,
    rent: 15000,
    utilities: 8000,
    equipment: 5000,
    other: 7000
  },
  totalExpenses: 115000,
  netProfit: 10000
}

const profitShares = [
  {
    partnerId: '1',
    partnerName: 'Partner A',
    sharePercent: 60,
    amount: monthlyData.netProfit * 0.6
  },
  {
    partnerId: '2',
    partnerName: 'Partner B',
    sharePercent: 40,
    amount: monthlyData.netProfit * 0.4
  }
]

// Historical data for the last 6 months
const historicalData = [
  { month: 'Aug 2024', revenue: 125000, expenses: 115000, profit: 10000 },
  { month: 'Jul 2024', revenue: 118000, expenses: 108000, profit: 10000 },
  { month: 'Jun 2024', revenue: 132000, expenses: 118000, profit: 14000 },
  { month: 'May 2024', revenue: 128000, expenses: 114000, profit: 14000 },
  { month: 'Apr 2024', revenue: 115000, expenses: 105000, profit: 10000 },
  { month: 'Mar 2024', revenue: 142000, expenses: 125000, profit: 17000 }
].reverse()

export default function PartnershipPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month')
  const [showDetails, setShowDetails] = useState(false)

  const periods = ['This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Partnership Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor profit sharing and partnership performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Total Revenue</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(monthlyData.revenue)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              +8.2% from last month
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Total Expenses</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(monthlyData.totalExpenses)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              {calculatePercentage(monthlyData.totalExpenses, monthlyData.revenue).toFixed(1)}% of revenue
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Net Profit</dt>
                <dd className="text-lg font-medium text-green-600">
                  {formatCurrency(monthlyData.netProfit)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-green-600">
              {calculatePercentage(monthlyData.netProfit, monthlyData.revenue).toFixed(1)}% profit margin
            </div>
          </div>
        </div>
      </div>

      {/* Partner Information and Profit Sharing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Partner Details */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Partnership Details</h3>
            <div className="space-y-6">
              {partners.map((partner, index) => (
                <div key={partner.id} className="border-l-4 border-blue-400 pl-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{partner.name}</h4>
                      <p className="text-sm text-gray-600">{partner.email}</p>
                      <p className="text-sm text-gray-600">{partner.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{partner.sharePercent}%</div>
                      <div className="text-sm text-gray-500">Share</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Joined:</span>
                      <div className="text-gray-900">{formatDate(partner.joinDate)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Investment:</span>
                      <div className="text-gray-900">{formatCurrency(partner.totalInvestment)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Month Profit Distribution */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Profit Distribution - {selectedPeriod}
            </h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Profit to Distribute</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(monthlyData.netProfit)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {profitShares.map((share) => (
                <div key={share.partnerId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{share.partnerName}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(share.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        share.sharePercent === 60 ? 'bg-blue-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${share.sharePercent}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {share.sharePercent}% of total profit
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showDetails ? 'Hide' : 'Show'} Calculation Details
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Calculation Breakdown:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span>{formatCurrency(monthlyData.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span>-{formatCurrency(monthlyData.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-medium text-gray-900">
                    <span>Net Profit:</span>
                    <span>{formatCurrency(monthlyData.netProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expense Categories */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(monthlyData.expenses).map(([category, amount]) => {
                const percentage = calculatePercentage(amount, monthlyData.totalExpenses)
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <span className="text-sm text-gray-600">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {percentage.toFixed(1)}% of total expenses
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Historical Performance */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">6-Month Performance</h3>
            <div className="space-y-4">
              {historicalData.map((data, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{data.month}</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(data.profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span>Revenue: </span>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div>
                      <span>Expenses: </span>
                      <span className="font-medium">{formatCurrency(data.expenses)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex text-xs">
                      <span className="text-gray-600">
                        Partner A ({partners[0].sharePercent}%): 
                      </span>
                      <span className="ml-1 font-medium text-blue-600">
                        {formatCurrency(data.profit * (partners[0].sharePercent / 100))}
                      </span>
                    </div>
                    <div className="flex text-xs">
                      <span className="text-gray-600">
                        Partner B ({partners[1].sharePercent}%): 
                      </span>
                      <span className="ml-1 font-medium text-green-600">
                        {formatCurrency(data.profit * (partners[1].sharePercent / 100))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Partnership Summary for {selectedPeriod}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Total profit distributed: {formatCurrency(monthlyData.netProfit)}</li>
                <li>Partner A receives: {formatCurrency(monthlyData.netProfit * 0.6)} (60%)</li>
                <li>Partner B receives: {formatCurrency(monthlyData.netProfit * 0.4)} (40%)</li>
                <li>Profit margin: {calculatePercentage(monthlyData.netProfit, monthlyData.revenue).toFixed(1)}%</li>
              </ul>
            </div>
            <div className="mt-4">
              <div className="flex space-x-4">
                <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                  Generate Report
                </button>
                <button className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-600 hover:bg-blue-50">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
