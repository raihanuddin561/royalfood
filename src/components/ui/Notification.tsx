'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

interface NotificationProps {
  type: 'success' | 'error'
  title?: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function Notification({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Allow fade out animation
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, onClose])

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-800',
      closeColor: 'text-green-500 hover:text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-800',
      closeColor: 'text-red-500 hover:text-red-700'
    }
  }

  const settings = config[type]
  const IconComponent = settings.icon

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  if (!isVisible) return null

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md w-full sm:w-auto mx-4 sm:mx-0
      ${settings.bg} ${settings.border} border rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <IconComponent className={`w-5 h-5 ${settings.iconColor} mr-3 mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0 pr-2">
            {title && (
              <h4 className={`text-sm font-semibold ${settings.titleColor} mb-1 break-words`}>
                {title}
              </h4>
            )}
            <p className={`text-sm ${settings.textColor} break-words leading-relaxed`} style={{wordWrap: 'break-word', overflowWrap: 'anywhere'}}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`${settings.closeColor} flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-5 transition-colors`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface UseNotificationReturn {
  showNotification: (type: 'success' | 'error', message: string, title?: string) => void
  notification: {
    type: 'success' | 'error'
    title?: string
    message: string
  } | null
  clearNotification: () => void
}

export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    title?: string
    message: string
  } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string, title?: string) => {
    setNotification({ type, title, message })
  }

  const clearNotification = () => {
    setNotification(null)
  }

  return {
    showNotification,
    notification,
    clearNotification
  }
}
