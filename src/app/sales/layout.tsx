'use client'

import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { BarChart3, Receipt, Plus, TrendingUp } from 'lucide-react'

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <Header />
          
          {/* Sales Navigation */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <h2 className="text-lg font-semibold text-gray-900">Sales Management</h2>
                <nav className="flex space-x-4">
                  <Link
                    href="/sales"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href="/sales/daily"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Daily Sales Per Item
                  </Link>
                  <Link
                    href="/sales/new"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Sale Entry
                  </Link>
                  <Link
                    href="/sales/profits"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Profit Analysis
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          <main className="p-6 min-h-screen bg-gray-50">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
