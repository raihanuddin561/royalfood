'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X, AlertTriangle, CheckCircle, Info, Shield, Trash2, Edit, Plus, Save } from 'lucide-react'

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'delete' | 'edit' | 'create'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  type?: ModalType
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  children: ReactNode
}

const modalTypeConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    titleColor: 'text-green-900'
  },
  error: {
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-900'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    titleColor: 'text-orange-900'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    titleColor: 'text-blue-900'
  },
  delete: {
    icon: Trash2,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-900'
  },
  edit: {
    icon: Edit,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    titleColor: 'text-blue-900'
  },
  create: {
    icon: Plus,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    titleColor: 'text-green-900'
  }
}

const sizeConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  type = 'info',
  size = 'md',
  closeOnBackdrop = true,
  children
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const config = modalTypeConfig[type]
  const IconComponent = config.icon

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      // Trap focus within modal
      const focusableElements = dialog.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus()
      }
    } else {
      dialog.close()
    }

    // Prevent body scroll while modal is open
    const prevOverflow = document.body.style.overflow
    if (isOpen) document.body.style.overflow = 'hidden'

    const handleClose = () => onClose()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()

      // Trap tab focus inside the dialog
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }

    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  // When clicking backdrop, target will be the dialog element itself
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnBackdrop) return
    if (e.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
  className={`backdrop:bg-gray-900 backdrop:bg-opacity-50 bg-transparent p-4 sm:p-0 ${sizeConfig[size]} w-full rounded-2xl shadow-xl`}
    >
      <div className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start min-w-0 flex-1 mr-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg} mr-3 flex-shrink-0`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-lg font-semibold ${config.titleColor} break-words leading-tight`}>
                {title}
              </h3>
              {description && (
                <p id="modal-desc" className="text-sm text-gray-600 mt-1 break-words leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </dialog>
  )
}

// Message component for consistent messaging
interface MessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onDismiss?: () => void
  showDismiss?: boolean
}

export function Message({ type, title, message, onDismiss, showDismiss = true }: MessageProps) {
  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      textColor: 'text-green-800',
      titleColor: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
      icon: AlertTriangle,
      iconColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      textColor: 'text-orange-800',
      titleColor: 'text-orange-900',
      icon: AlertTriangle,
      iconColor: 'text-orange-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600'
    }
  }

  const settings = config[type]
  const IconComponent = settings.icon

  return (
    <div className={`${settings.bg} ${settings.border} border rounded-lg p-4 mb-4`}>
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
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className={`${settings.textColor} hover:${settings.titleColor} flex-shrink-0 text-lg leading-none p-1 hover:bg-black hover:bg-opacity-5 rounded transition-colors`}
            aria-label="Dismiss message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Loading component
interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loading({ message = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3`}></div>
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  )
}

// Button component for consistent styling
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: ReactNode
  className?: string
}

export function Button({
  variant,
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  children,
  className = ''
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed text-center'
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white border border-transparent hover:bg-blue-700 disabled:bg-blue-400',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white border border-transparent hover:bg-red-700 disabled:bg-red-400',
    success: 'bg-green-600 text-white border border-transparent hover:bg-green-700 disabled:bg-green-400',
    warning: 'bg-orange-600 text-white border border-transparent hover:bg-orange-700 disabled:bg-orange-400'
  }

  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      <span className="truncate">{children}</span>
    </button>
  )
}

// ConfirmModal - small reusable confirmation dialog
interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  danger = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      type={danger ? 'delete' : 'warning'}
      size="sm"
      closeOnBackdrop={false}
    >
      <div className="pt-2">
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel} className="px-4 py-2" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
