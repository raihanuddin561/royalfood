'use client'

import { useState } from 'react'
import { BaseModal, Message, Button, Loading } from './Modal'
import { AlertTriangle, Shield, Info } from 'lucide-react'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  itemName: string
  itemType: string
  warningMessage?: string
  hasRelatedData?: boolean
  relatedDataMessage?: string
  isDestructive?: boolean
  confirmText?: string
  requiresDoubleConfirmation?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  warningMessage,
  hasRelatedData = false,
  relatedDataMessage,
  isDestructive = true,
  confirmText = 'DELETE',
  requiresDoubleConfirmation = false
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationText, setConfirmationText] = useState('')
  
  const needsTextConfirmation = requiresDoubleConfirmation && isDestructive
  const isConfirmationValid = needsTextConfirmation 
    ? confirmationText === confirmText 
    : true

  const handleDelete = async () => {
    if (!isConfirmationValid) return

    setIsDeleting(true)
    setError(null)
    
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error('Delete operation failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setError(null)
    setConfirmationText('')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Delete ${itemType}`}
      description={`You are about to delete "${itemName}"`}
      type="delete"
      size="md"
      closeOnBackdrop={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning Message */}
        {warningMessage && (
          <Message
            type="warning"
            title="Warning"
            message={warningMessage}
            showDismiss={false}
          />
        )}

        {/* Related Data Warning */}
        {hasRelatedData && relatedDataMessage && (
          <Message
            type="error"
            title="Related Data Found"
            message={relatedDataMessage}
            showDismiss={false}
          />
        )}

        {/* General Warning */}
        {!warningMessage && !hasRelatedData && (
          <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                Confirm Deletion
              </h4>
              <p className="text-sm text-red-800">
                This action cannot be undone. The {itemType.toLowerCase()} "{itemName}" will be permanently deleted.
              </p>
            </div>
          </div>
        )}

        {/* Double Confirmation Input */}
        {needsTextConfirmation && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type <span className="font-mono font-bold text-red-600">{confirmText}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${confirmText}" here`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 font-mono text-sm"
              disabled={isDeleting}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Message
            type="error"
            title="Delete Failed"
            message={error}
            showDismiss={false}
          />
        )}

        {/* Loading State */}
        {isDeleting && (
          <Loading message="Deleting..." />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 sm:gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            loading={isDeleting}
            className="flex-1 sm:min-w-[100px]"
          >
            {isDestructive ? 'Delete' : 'Confirm'}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}

interface DeactivateConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  itemName: string
  itemType: string
  currentStatus: boolean
  statusMessage?: string
}

export function StatusToggleModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  currentStatus,
  statusMessage
}: DeactivateConfirmationProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const action = currentStatus ? 'Deactivate' : 'Activate'
  const actionPast = currentStatus ? 'deactivated' : 'activated'
  const actionColor = currentStatus ? 'warning' : 'success'

  const handleToggle = async () => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error('Status toggle failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (isUpdating) return
    setError(null)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${action} ${itemType}`}
      description={`Change status for "${itemName}"`}
      type={currentStatus ? 'warning' : 'success'}
      size="md"
      closeOnBackdrop={!isUpdating}
    >
      <div className="space-y-4">
        {/* Status Change Info */}
        <div className={`flex items-start p-4 ${currentStatus ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} border rounded-lg`}>
          <Shield className={`w-5 h-5 ${currentStatus ? 'text-orange-600' : 'text-green-600'} mr-3 mt-0.5 flex-shrink-0`} />
          <div>
            <h4 className={`text-sm font-semibold ${currentStatus ? 'text-orange-900' : 'text-green-900'} mb-1`}>
              {action} {itemType}
            </h4>
            <p className={`text-sm ${currentStatus ? 'text-orange-800' : 'text-green-800'}`}>
              {statusMessage || 
                `The ${itemType.toLowerCase()} "${itemName}" will be ${actionPast}. ${
                  currentStatus 
                    ? 'It will no longer be available for use but can be reactivated later.' 
                    : 'It will become available for use again.'
                }`
              }
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Message
            type="error"
            title="Status Update Failed"
            message={error}
            showDismiss={false}
          />
        )}

        {/* Loading State */}
        {isUpdating && (
          <Loading message={`${action.slice(0, -1)}ing...`} />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUpdating}
            className="flex-1 sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant={currentStatus ? 'warning' : 'success'}
            onClick={handleToggle}
            disabled={isUpdating}
            loading={isUpdating}
            className="flex-1 sm:min-w-[100px]"
          >
            {action}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}

interface EditConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  message: string
  hasChanges?: boolean
  isValid?: boolean
  validationError?: string
}

export function EditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  hasChanges = true,
  isValid = true,
  validationError
}: EditConfirmationProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!isValid || !hasChanges) return

    setIsSaving(true)
    setError(null)
    
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error('Save operation failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    setError(null)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={message}
      type="edit"
      size="md"
      closeOnBackdrop={!isSaving}
    >
      <div className="space-y-4">
        {/* No Changes Warning */}
        {!hasChanges && (
          <Message
            type="info"
            title="No Changes Detected"
            message="No changes have been made to save."
            showDismiss={false}
          />
        )}

        {/* Validation Error */}
        {!isValid && validationError && (
          <Message
            type="error"
            title="Validation Error"
            message={validationError}
            showDismiss={false}
          />
        )}

        {/* General Error */}
        {error && (
          <Message
            type="error"
            title="Save Failed"
            message={error}
            showDismiss={false}
          />
        )}

        {/* Loading State */}
        {isSaving && (
          <Loading message="Saving changes..." />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || !isValid || isSaving}
            loading={isSaving}
            className="flex-1 sm:min-w-[100px]"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
