'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export function Notification({ 
  type, 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto close functionality
  if (autoClose && duration > 0) {
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
  }

  if (!isVisible) return null

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full z-50 ${getColors()} border rounded-lg p-4 shadow-lg transition-all duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5 text-lg">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm mt-1 break-words">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  error?: Error | null
  reset?: () => void
  fallbackMessage?: string
}

export function ErrorBoundary({ 
  error, 
  reset, 
  fallbackMessage = 'Something went wrong. Please try again.' 
}: ErrorBoundaryProps) {
  if (!error) return null

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{fallbackMessage}</p>
        {reset && (
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading...' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  message?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4`}></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  )
}
