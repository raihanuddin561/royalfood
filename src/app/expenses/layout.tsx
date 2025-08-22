import { Metadata } from 'next'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import { DollarSign, BarChart3, Plus, FileText, Receipt } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Expense Management | Royal Food',
  description: 'Comprehensive expense tracking and management system',
}

export default function ExpenseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        {/* Expense Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h2 className="text-lg font-semibold text-gray-900">Expense Management</h2>
              <nav className="flex space-x-4">
                <Link
                  href="/expenses"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  All Expenses
                </Link>
                <Link
                  href="/expenses?type=STOCK"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Stock Expenses
                </Link>
                <Link
                  href="/expenses?type=PAYROLL"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Payroll Expenses
                </Link>
                <Link
                  href="/expenses/reports"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
