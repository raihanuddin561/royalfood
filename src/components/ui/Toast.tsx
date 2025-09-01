'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null
let globalRemoveToast: ((id: string) => void) | null = null

// Global toast functions
export const toast = {
  success: (title: string, message: string = '', duration?: number) => {
    if (globalAddToast) {
      globalAddToast({ type: 'success', title, message, duration })
    }
  },
  error: (title: string, message: string = '', duration?: number) => {
    if (globalAddToast) {
      globalAddToast({ type: 'error', title, message, duration })
    }
  },
  warning: (title: string, message: string = '', duration?: number) => {
    if (globalAddToast) {
      globalAddToast({ type: 'warning', title, message, duration })
    }
  },
  info: (title: string, message: string = '', duration?: number) => {
    if (globalAddToast) {
      globalAddToast({ type: 'info', title, message, duration })
    }
  }
}

function ToastItem({ toast: toastData, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setIsVisible(true)
    
    // Auto remove
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(toastData.id), 300) // Wait for exit animation
    }, toastData.duration || 5000)
    
    return () => clearTimeout(timer)
  }, [toastData.id, toastData.duration, onRemove])

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-800'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-800'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-900',
      textColor: 'text-orange-800'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800'
    }
  }

  const settings = config[toastData.type]
  const IconComponent = settings.icon

  return (
    <div 
      className={`
        ${settings.bg} ${settings.border} border rounded-lg shadow-lg p-4 mb-3 min-w-96 max-w-md
        transform transition-all duration-300 ease-out
        ${isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className="flex items-start">
        <IconComponent className={`w-5 h-5 ${settings.iconColor} mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${settings.titleColor} mb-1`}>
            {toastData.title}
          </h4>
          {toastData.message && (
            <p className={`text-sm ${settings.textColor}`}>
              {toastData.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onRemove(toastData.id), 300)
          }}
          className={`${settings.textColor} hover:${settings.titleColor} flex-shrink-0 ml-2 p-1 hover:bg-black hover:bg-opacity-5 rounded transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toastData, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Set global functions
  useEffect(() => {
    globalAddToast = addToast
    globalRemoveToast = removeToast
    
    return () => {
      globalAddToast = null
      globalRemoveToast = null
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toastData => (
        <ToastItem
          key={toastData.id}
          toast={toastData}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}
