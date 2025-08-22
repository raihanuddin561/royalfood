'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details for debugging
    console.warn('ErrorBoundary caught an error:', error, errorInfo)
    
    // Only log hydration errors as warnings since they're often caused by browser extensions
    if (error.message?.includes('Hydration') || error.message?.includes('hydration')) {
      console.warn('Hydration mismatch detected. This is usually caused by browser extensions or dynamic content.')
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
          <span className="text-orange-800 text-sm">
            Something went wrong. Please refresh the page.
          </span>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook version of ErrorBoundary for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
