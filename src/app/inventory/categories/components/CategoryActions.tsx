'use client'

import { Edit, Trash2, Power, PowerOff, AlertTriangle, Check } from 'lucide-react'
import { toggleCategoryStatus, deleteCategory } from '@/app/actions/categories'
import { useState } from 'react'
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog'

interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
  _count: {
    items: number
  }
}

interface CategoryActionsProps {
  category: Category
}

export function CategoryActions({ category }: CategoryActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000) // Show for 5 seconds
  }

  const handleToggleStatus = async () => {
    if (isTogglingStatus) return

    setIsTogglingStatus(true)
    try {
      const result = await toggleCategoryStatus(category.id)
      
      if (result.success) {
        showMessage('success', result.message)
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      showMessage('error', 'An unexpected error occurred while updating status')
      console.error('Toggle status error:', error)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (isDeleting) return

    const result = await deleteCategory(category.id)
    
    if (result.success) {
      showMessage('success', result.message)
      setShowDeleteDialog(false)
    } else {
      showMessage('error', result.message)
      throw new Error(result.message)  // This will be caught by the modal
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="relative">
      {/* Status Message */}
      {message && (
        <div className={`absolute top-full right-0 mt-2 p-3 rounded-lg text-sm min-w-80 max-w-96 z-10 shadow-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              {message.type === 'success' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {message.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="mt-1 break-words">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Edit Button */}
        <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200">
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </button>
        
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
        
        {/* Status Toggle Button */}
        <button
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-lg transition-colors duration-200 ${
            category.isActive
              ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 disabled:bg-red-100'
              : 'border-green-300 text-green-700 bg-white hover:bg-green-50 disabled:bg-green-100'
          } disabled:cursor-not-allowed`}
        >
          {isTogglingStatus ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              Updating...
            </>
          ) : (
            <>
              {category.isActive ? (
                <PowerOff className="w-3 h-3 mr-1" />
              ) : (
                <Power className="w-3 h-3 mr-1" />
              )}
              {category.isActive ? 'Deactivate' : 'Activate'}
            </>
          )}
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDialog}
        onConfirm={handleDeleteConfirm}
        category={category}
        isDeleting={false}
      />
    </div>
  )
}
