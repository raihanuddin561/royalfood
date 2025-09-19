'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteInventoryItem, hardDeleteInventoryItem } from '@/app/actions/inventory'
import { useRouter } from 'next/navigation'
import { DeleteConfirmationModal } from '@/components/ui/ConfirmationModals'
import { NoSSR } from '@/components/NoSSR'

interface DeleteItemButtonProps {
  itemId: string
  itemName: string
  hasRelatedRecords?: boolean
}

export function DeleteItemButton({ itemId, itemName, hasRelatedRecords }: DeleteItemButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false)
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)
  const router = useRouter()

  const handleSoftDeleteConfirm = async () => {
    // Validate inputs
    if (!itemId || !itemName) {
      throw new Error('Invalid item data. Please refresh the page and try again.')
    }

    const result = await deleteInventoryItem(itemId)
    
    if (result.success) {
      // Refresh the page to show updated data
      router.refresh()
    } else {
      // Let the modal handle the error display
      throw new Error(result.message || 'Failed to process the deletion request')
    }
  }

  const handleHardDeleteConfirm = async () => {
    // Validate inputs
    if (!itemId || !itemName) {
      throw new Error('Invalid item data. Please refresh the page and try again.')
    }

    const result = await hardDeleteInventoryItem(itemId)
    
    if (result.success) {
      // Refresh the page to show updated data
      router.refresh()
    } else {
      // Let the modal handle the error display
      throw new Error(result.message || 'Failed to permanently delete the item')
    }
  }

  return (
    <NoSSR fallback={
      <button className="text-gray-400 p-1 rounded" disabled>
        <Trash2 className="w-4 h-4" />
      </button>
    }>
      <div className="relative">
        <button
          onClick={() => setShowDeleteOptions(!showDeleteOptions)}
          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
          title="Delete options"
          suppressHydrationWarning
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Delete Options Dropdown */}
        {showDeleteOptions && (
          <div className="absolute right-0 top-8 z-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <button
              onClick={() => {
                setShowDeleteOptions(false)
                setShowDeleteModal(true)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2 text-orange-500" />
              <div>
                <div className="font-medium">Soft Delete</div>
                <div className="text-xs text-gray-500">Deactivate (can be restored)</div>
              </div>
            </button>
            <button
              onClick={() => {
                setShowDeleteOptions(false)
                setShowHardDeleteModal(true)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              <div>
                <div className="font-medium text-red-600">Hard Delete</div>
                <div className="text-xs text-gray-500">Permanently remove from database</div>
              </div>
            </button>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDeleteOptions && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowDeleteOptions(false)}
          />
        )}
      </div>

      {/* Soft Delete Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleSoftDeleteConfirm}
        itemName={itemName}
        itemType="Inventory Item"
        hasRelatedData={hasRelatedRecords}
        relatedDataMessage={
          hasRelatedRecords
            ? "This item has related records (inventory logs, orders, etc.). It will be marked as inactive instead of being permanently deleted. You can reactivate it later if needed."
            : "This item will be marked as inactive. You can reactivate it later if needed."
        }
        warningMessage="This is a reversible action. The item will be hidden from your inventory list but can be restored."
        isDestructive={false}
        requiresDoubleConfirmation={false}
      />

      {/* Hard Delete Modal */}
      <DeleteConfirmationModal
        isOpen={showHardDeleteModal}
        onClose={() => setShowHardDeleteModal(false)}
        onConfirm={handleHardDeleteConfirm}
        itemName={itemName}
        itemType="Inventory Item"
        hasRelatedData={true}
        relatedDataMessage="⚠️ PERMANENT DELETION: This will permanently remove the item and ALL related records including inventory logs, purchase history, order records, recipe connections, and stock usage data from the database."
        warningMessage="THIS ACTION CANNOT BE UNDONE. All data related to this item will be lost forever. Consider using soft delete if you might need this data later."
        isDestructive={true}
        requiresDoubleConfirmation={true}
      />
    </NoSSR>
  )
}
