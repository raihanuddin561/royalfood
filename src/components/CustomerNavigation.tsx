import Link from 'next/link'

export default function CustomerNavigation() {
  return (
    <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-lg font-semibold">Customer Features</h2>
          <p className="text-sm opacity-90">New customer-facing functionality</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/" 
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            🏠 Home
          </Link>
          <Link 
            href="/summary" 
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors text-sm"
          >
            📊 Summary
          </Link>
          <Link 
            href="/public-menu" 
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            🛒 Public Menu
          </Link>
          <Link 
            href="/admin/customer-orders" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors text-sm"
          >
            📋 Customer Orders
          </Link>
          <Link 
            href="/orders" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors text-sm"
          >
            🍽️ All Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
