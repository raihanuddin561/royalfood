'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteInventoryItem } from '@/app/actions/inventory'
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
  const router = useRouter()

  const handleDeleteConfirm = async () => {
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

  return (
    <NoSSR fallback={
      <button className="text-gray-400 p-1 rounded" disabled>
        <Trash2 className="w-4 h-4" />
      </button>
    }>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
        title="Delete item"
        suppressHydrationWarning
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={itemName}
        itemType="Inventory Item"
        hasRelatedData={hasRelatedRecords}
        relatedDataMessage={
          hasRelatedRecords
            ? "This item has related records (inventory logs, orders, etc.). It will be marked as inactive instead of being permanently deleted. You can reactivate it later if needed."
            : undefined
        }
        warningMessage={
          !hasRelatedRecords
            ? "This action cannot be undone. The item will be permanently removed from your inventory database."
            : undefined
        }
        isDestructive={!hasRelatedRecords}
        requiresDoubleConfirmation={false}
      />
    </NoSSR>
  )
}
