'use client'

import { DeleteConfirmationModal } from '@/components/ui/ConfirmationModals'

interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
  _count: {
    items: number
  }
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  category: Category
  isDeleting: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  category,
  isDeleting
}: DeleteConfirmationDialogProps) {
  const hasItems = category._count.items > 0
  const willBeDeactivated = hasItems

  return (
    <DeleteConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      itemName={category.name}
      itemType="Category"
      hasRelatedData={hasItems}
      relatedDataMessage={
        hasItems
          ? `This category has ${category._count.items} associated items. It will be deactivated to preserve data integrity. You can reactivate it later if needed.`
          : undefined
      }
      warningMessage={
        !hasItems
          ? "This category has no associated items and will be permanently deleted. This action cannot be undone."
          : undefined
      }
      isDestructive={!hasItems}
      requiresDoubleConfirmation={false}
    />
  )
}
