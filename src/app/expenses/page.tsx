'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Filter, Search, Calendar, DollarSign, TrendingUp, TrendingDown, Receipt, Users, Package, Wrench, Building } from 'lucide-react'
import { ExpenseType, ExpenseStatus } from '@prisma/client'
import { 
  getExpenses, 
  getExpenseCategories, 
  getExpenseAnalytics,
  initializeExpenseCategories
} from '@/app/actions/expenses'
import ExpenseForm from './components/ExpenseFormFixed'
import SimpleExpenseForm from './components/SimpleExpenseForm'
import ExpenseActions from './components/ExpenseActions'

interface Expense {
  id: string
  description: string
  amount: number
  expenseDate: Date
  status: ExpenseStatus
  receiptImage?: string
  supplierInfo?: string
  taxAmount: number
  isRecurring: boolean
  notes?: string
  expenseCategory: {
    id: string
    name: string
    type: ExpenseType
  }
  payroll?: {
    employee: {
      user: {
        name: string
      }
    }
  }
  employee?: {
    user: {
      name: string
    }
  }
  purchase?: {
    supplier: {
      name: string
    }
  }
}

interface ExpenseCategory {
  id: string
  name: string
  type: ExpenseType
  description?: string
  _count: {
    expenses: number
  }
}

const EXPENSE_TYPE_ICONS: Record<ExpenseType, any> = {
  PAYROLL: Users,
  STOCK: Package,
  UTILITIES: Building,
  RENT: Building,
  MAINTENANCE: Wrench,
  MARKETING: TrendingUp,
  INSURANCE: Building,
  TAXES: Receipt,
  OPERATIONAL: DollarSign,
  OTHER: DollarSign
}

const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  PAYROLL: 'bg-blue-100 text-blue-800',
  STOCK: 'bg-green-100 text-green-800',
  UTILITIES: 'bg-yellow-100 text-yellow-800',
  RENT: 'bg-purple-100 text-purple-800',
  MAINTENANCE: 'bg-red-100 text-red-800',
  MARKETING: 'bg-pink-100 text-pink-800',
  INSURANCE: 'bg-indigo-100 text-indigo-800',
  TAXES: 'bg-orange-100 text-orange-800',
  OPERATIONAL: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-slate-100 text-slate-800'
}

function ExpensePageContent() {
  const searchParams = useSearchParams()
  const typeFromUrl = searchParams.get('type') as ExpenseType | null
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<ExpenseType | 'all'>(typeFromUrl || 'all')
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })

  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedType, selectedStatus, dateRange])

  const loadData = async () => {
    setLoading(true)

    try {
      // Initialize categories if first time
      await initializeExpenseCategories()

      // Load expenses
      const expensesResult = await getExpenses({
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: 100
      })

      if (expensesResult.success) {
        setExpenses(expensesResult.expenses || [])
      }

      // Load categories
      const categoriesResult = await getExpenseCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories || [])
      }

      // Load analytics
      const analyticsResult = await getExpenseAnalytics({
        startDate: dateRange.from,
        endDate: dateRange.to
      })

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.analytics)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.expenseCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.supplierInfo && expense.supplierInfo.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="mt-2 text-gray-600">Track all business expenses for accurate profit analysis</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button 
            onClick={() => setShowExpenseForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.totalCount} transactions</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.typeBreakdown.find((t: any) => t.type === 'STOCK')?.total_amount || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Inventory costs</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payroll Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.typeBreakdown.find((t: any) => t.type === 'PAYROLL')?.total_amount || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Employee costs</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operational Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.typeBreakdown.find((t: any) => t.type === 'OPERATIONAL')?.total_amount || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Daily operations</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category._count.expenses})
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ExpenseType | 'all')}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="PAYROLL">Payroll</option>
            <option value="STOCK">Stock</option>
            <option value="UTILITIES">Utilities</option>
            <option value="RENT">Rent</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="MARKETING">Marketing</option>
            <option value="INSURANCE">Insurance</option>
            <option value="TAXES">Taxes</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ExpenseStatus | 'all')}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid</option>
          </select>

          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.from.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="date"
              value={dateRange.to.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Expense Transactions</h3>
          <p className="text-sm text-gray-500">{filteredExpenses.length} expenses found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Expense Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Related To</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => {
                const IconComponent = EXPENSE_TYPE_ICONS[expense.expenseCategory.type]
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${EXPENSE_TYPE_COLORS[expense.expenseCategory.type]}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-500">{expense.notes.slice(0, 50)}...</div>
                          )}
                          {expense.isRecurring && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              Recurring
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.expenseCategory.name}</div>
                      <div className="text-sm text-gray-500">{expense.expenseCategory.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</div>
                      {expense.taxAmount > 0 && (
                        <div className="text-sm text-gray-500">Tax: {formatCurrency(expense.taxAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(expense.expenseDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        expense.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.payroll?.employee.user.name && (
                        <div>Employee: {expense.payroll.employee.user.name}</div>
                      )}
                      {expense.employee?.user.name && (
                        <div>Employee: {expense.employee.user.name}</div>
                      )}
                      {expense.purchase?.supplier.name && (
                        <div>Supplier: {expense.purchase.supplier.name}</div>
                      )}
                      {expense.supplierInfo && !expense.purchase && (
                        <div>Supplier: {expense.supplierInfo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ExpenseActions 
                        expense={expense} 
                        categories={categories}
                        onUpdate={loadData}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No expenses found</h3>
              <p className="mt-1 text-sm text-gray-500">Expense records will appear here once added.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        onSuccess={loadData}
      />
    </div>
  )
}

export default function ExpenseManagementPage() {
  return (
    <Suspense fallback={<div>Loading expenses...</div>}>
      <ExpensePageContent />
    </Suspense>
  )
}
