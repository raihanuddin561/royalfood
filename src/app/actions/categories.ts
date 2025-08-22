'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCategory(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isActive = formData.get('isActive') === 'on'

    if (!name) {
      throw new Error('Category name is required')
    }

    // Check if category already exists (case-insensitive check)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingCategory && existingCategory.name.toLowerCase() === name.trim().toLowerCase()) {
      throw new Error('A category with this name already exists')
    }

    // Create the category
    await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive
      }
    })

    // Revalidate the pages that show categories
    revalidatePath('/inventory/categories')
    revalidatePath('/inventory/add')
    revalidatePath('/inventory')

    return { success: true, message: 'Category created successfully!' }
  } catch (error) {
    console.error('Create category error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create category' 
    }
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isActive = formData.get('isActive') === 'on'

    if (!id || !name) {
      throw new Error('Category ID and name are required')
    }

    // Check if another category has the same name (case-insensitive check)
    const allCategories = await prisma.category.findMany({
      where: {
        NOT: {
          id: id
        }
      },
      select: {
        name: true
      }
    })

    const existingCategory = allCategories.find(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (existingCategory) {
      throw new Error('A category with this name already exists')
    }

    // Update the category
    await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive
      }
    })

    // Revalidate the pages that show categories
    revalidatePath('/inventory/categories')
    revalidatePath('/inventory/add')
    revalidatePath('/inventory')

    return { success: true, message: 'Category updated successfully!' }
  } catch (error) {
    console.error('Update category error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update category' 
    }
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    // Input validation
    if (!categoryId || typeof categoryId !== 'string') {
      return { 
        success: false, 
        message: 'Invalid category ID provided. Please refresh the page and try again.' 
      }
    }

    if (categoryId.length < 1) {
      return { 
        success: false, 
        message: 'Category ID cannot be empty.' 
      }
    }

    // Check if category exists and get related data
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        menuItems: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!existingCategory) {
      return { 
        success: false, 
        message: 'This category no longer exists. It may have already been deleted by another user.' 
      }
    }

    // Check if category is already inactive
    if (!existingCategory.isActive) {
      return { 
        success: false, 
        message: 'This category is already deactivated.' 
      }
    }

    // Check if category has related records
    const hasItems = existingCategory.items.length > 0
    const hasMenuItems = existingCategory.menuItems.length > 0
    const hasRelatedRecords = hasItems || hasMenuItems

    if (hasRelatedRecords) {
      // Soft delete - mark as inactive instead of hard delete
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      // Revalidate pages
      revalidatePath('/inventory/categories')
      revalidatePath('/inventory/add')
      revalidatePath('/inventory')

      const relatedRecordsText = [
        hasItems && `${existingCategory.items.length} inventory items`,
        hasMenuItems && `${existingCategory.menuItems.length} menu items`
      ].filter(Boolean).join(', ')

      return { 
        success: true, 
        message: `Category "${existingCategory.name}" has been deactivated because it has related records (${relatedRecordsText}). You can reactivate it later if needed.`,
        isDeactivated: true
      }
    } else {
      // Hard delete if no related records
      try {
        await prisma.category.delete({
          where: { id: categoryId }
        })
      } catch (deleteError: any) {
        if (deleteError?.code === 'P2003') {
          // Foreign key constraint error - there are related records we didn't detect
          return { 
            success: false, 
            message: 'Cannot delete category because it has related records. Please try deactivating it instead.' 
          }
        }
        throw deleteError
      }

      // Revalidate pages
      revalidatePath('/inventory/categories')
      revalidatePath('/inventory/add')
      revalidatePath('/inventory')

      return { 
        success: true, 
        message: `Category "${existingCategory.name}" has been permanently deleted.`,
        isDeactivated: false
      }
    }
  } catch (error: any) {
    console.error('Delete category error:', error)
    
    // Handle specific database errors
    if (error?.code === 'P2025') {
      return { 
        success: false, 
        message: 'Category not found. It may have already been deleted.' 
      }
    } else if (error?.code === 'P2003') {
      return { 
        success: false, 
        message: 'Cannot delete category because it has related records. Please deactivate it instead.' 
      }
    } else if (error?.code === 'P1001') {
      return { 
        success: false, 
        message: 'Database connection failed. Please try again in a moment.' 
      }
    } else if (error?.message?.includes('timeout')) {
      return { 
        success: false, 
        message: 'Operation timed out. Please check your connection and try again.' 
      }
    } else {
      return { 
        success: false, 
        message: error instanceof Error ? 
          `Operation failed: ${error.message}` : 
          'An unexpected error occurred. Please try again or contact support if the problem persists.'
      }
    }
  }
}

export async function toggleCategoryStatus(categoryId: string) {
  try {
    // Input validation
    if (!categoryId || typeof categoryId !== 'string') {
      return { 
        success: false, 
        message: 'Invalid category ID provided. Please refresh the page and try again.' 
      }
    }

    // Get current category status
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return { 
        success: false, 
        message: 'This category no longer exists. It may have been deleted by another user.' 
      }
    }

    const newStatus = !existingCategory.isActive
    const actionText = newStatus ? 'activated' : 'deactivated'

    // Toggle the status
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        isActive: newStatus,
        updatedAt: new Date()
      }
    })

    // Revalidate pages
    revalidatePath('/inventory/categories')
    revalidatePath('/inventory/add')
    revalidatePath('/inventory')

    return { 
      success: true, 
      message: `"${existingCategory.name}" has been successfully ${actionText}.`,
      isActive: updatedCategory.isActive
    }
  } catch (error: any) {
    console.error('Toggle category status error:', error)
    
    // Handle specific database errors
    if (error?.code === 'P2025') {
      return { 
        success: false, 
        message: 'Category not found. It may have already been deleted.' 
      }
    } else if (error?.code === 'P1001') {
      return { 
        success: false, 
        message: 'Database connection failed. Please try again in a moment.' 
      }
    } else if (error?.message?.includes('timeout')) {
      return { 
        success: false, 
        message: 'Operation timed out. Please check your connection and try again.' 
      }
    } else {
      return { 
        success: false, 
        message: error instanceof Error ? 
          `Status update failed: ${error.message}` : 
          'An unexpected error occurred while updating category status. Please try again.'
      }
    }
  }
}
