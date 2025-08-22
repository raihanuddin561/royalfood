import Link from 'next/link'
import { AlertTriangle, Home, LogIn } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
            
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
