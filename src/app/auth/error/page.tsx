'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'AccessDenied':
        return 'Access denied. Your account may be deactivated or you may not have the required permissions.'
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.'
      case 'Verification':
        return 'The sign in link is no longer valid. Please request a new one.'
      case 'Default':
      default:
        return 'An error occurred during sign in. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-xs text-red-700 font-mono">Error: {error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link href="/auth/support" className="font-medium text-indigo-600 hover:text-indigo-500">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
