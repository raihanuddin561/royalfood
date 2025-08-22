'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createInventoryItem(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const categoryId = formData.get('categoryId') as string
    const supplierId = formData.get('supplierId') as string || null
    const unit = formData.get('unit') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const initialStock = parseFloat(formData.get('initialStock') as string)
    const reorderLevel = parseFloat(formData.get('reorderLevel') as string)
    const description = formData.get('description') as string || null
    const brand = formData.get('brand') as string || null
    const grade = formData.get('grade') as string || null
    const specification = formData.get('specification') as string || null
    const packSize = formData.get('packSize') as string || null

    // Validation
    if (!name || !categoryId || !unit || isNaN(costPrice) || isNaN(initialStock) || isNaN(reorderLevel)) {
      throw new Error('Required fields are missing or invalid')
    }

    if (costPrice <= 0) {
      throw new Error('Cost price must be greater than 0')
    }

    if (initialStock < 0 || reorderLevel < 0) {
      throw new Error('Stock quantities cannot be negative')
    }

    // Check if item with same name already exists
    const existingItem = await prisma.item.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingItem && existingItem.name.toLowerCase() === name.trim().toLowerCase()) {
      throw new Error('An item with this name already exists')
    }

    // Verify unit exists
    const validUnits = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'box', 'bag', 'bottle', 'can']
    if (!validUnits.includes(unit)) {
      throw new Error('Invalid unit selected')
    }

    // Generate SKU if not provided
    let finalSku = sku?.trim()
    if (!finalSku) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true }
      })
      
      if (category) {
        const categoryPrefix = category.name.substring(0, 3).toUpperCase()
        const itemCount = await prisma.item.count({
          where: { categoryId }
        })
        finalSku = `${categoryPrefix}-${String(itemCount + 1).padStart(3, '0')}`
      } else {
        finalSku = `ITM-${String(Date.now()).slice(-6)}`
      }
    } else {
      // Check if SKU already exists
      const existingSku = await prisma.item.findFirst({
        where: { sku: finalSku }
      })
      
      if (existingSku) {
        throw new Error('An item with this SKU already exists')
      }
    }

    // Create the item
    const newItem = await prisma.item.create({
      data: {
        name: name.trim(),
        sku: finalSku,
        categoryId,
        supplierId,
        unit,
        costPrice,
        // No selling price for ingredients/stock items
        currentStock: initialStock,
        reorderLevel,
        description,
        brand,
        grade,
        specification,
        packSize,
        isActive: true
      }
    })

    // Create initial inventory log for the stock
    if (initialStock > 0) {
      // Get the first admin user for the inventory log
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      
      if (!adminUser) {
        throw new Error('No admin user found. Please run database seeding first.')
      }

      await prisma.inventoryLog.create({
        data: {
          itemId: newItem.id,
          userId: adminUser.id,
          type: 'STOCK_IN',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Initial stock entry',
          reference: `Initial-${newItem.sku}`
        }
      })
    }

    // Revalidate the pages that show items
    revalidatePath('/inventory')
    revalidatePath('/inventory/add')

    return { 
      success: true, 
      message: `Item "${name}" created successfully with SKU: ${finalSku}`,
      itemId: newItem.id,
      sku: finalSku
    }
  } catch (error) {
    console.error('Create inventory item error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create inventory item' 
    }
  }
}

export async function createBulkInventoryItems(formData: FormData) {
  try {
    const items = []
    const formEntries = Array.from(formData.entries())
    
    // Group form entries by item index
    const itemsData: Record<string, Record<string, string>> = {}
    
    formEntries.forEach(([key, value]) => {
      const match = key.match(/^item_(\d+)_(.+)$/)
      if (match) {
        const [, index, field] = match
        if (!itemsData[index]) itemsData[index] = {}
        itemsData[index][field] = value as string
      }
    })

    // Process each item
    for (const [index, itemData] of Object.entries(itemsData)) {
      if (!itemData.name || !itemData.categoryId || !itemData.unit || !itemData.costPrice || !itemData.initialStock || !itemData.reorderLevel) {
        continue // Skip incomplete items
      }

      const costPrice = parseFloat(itemData.costPrice)
      const initialStock = parseFloat(itemData.initialStock)
      const reorderLevel = parseFloat(itemData.reorderLevel)

      if (isNaN(costPrice) || isNaN(initialStock) || isNaN(reorderLevel)) {
        continue // Skip invalid items
      }

      // Generate SKU
      const category = await prisma.category.findUnique({
        where: { id: itemData.categoryId },
        select: { name: true }
      })
      
      let sku = ''
      if (category) {
        const categoryPrefix = category.name.substring(0, 3).toUpperCase()
        const itemCount = await prisma.item.count({
          where: { categoryId: itemData.categoryId }
        })
        sku = `${categoryPrefix}-${String(itemCount + items.length + 1).padStart(3, '0')}`
      }

      items.push({
        name: itemData.name.trim(),
        sku,
        categoryId: itemData.categoryId,
        unit: itemData.unit,
        costPrice,
        // No selling price for ingredients/stock items
        currentStock: initialStock,
        reorderLevel,
        isActive: true
      })
    }

    if (items.length === 0) {
      throw new Error('No valid items to create')
    }

    // Create all items
    const createdItems = await prisma.item.createMany({
      data: items
    })

    // Get the created items to create inventory logs
    const newItems = await prisma.item.findMany({
      where: {
        sku: {
          in: items.map(item => item.sku)
        }
      }
    })

    // Get the first admin user for inventory logs
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      throw new Error('No admin user found. Please run database seeding first.')
    }

    // Create inventory logs for items with initial stock
    const inventoryLogs = newItems
      .filter(item => item.currentStock > 0)
      .map(item => ({
        itemId: item.id,
        userId: adminUser.id,
        type: 'STOCK_IN' as const,
        quantity: item.currentStock,
        previousStock: 0,
        newStock: item.currentStock,
        reason: 'Initial stock entry',
        reference: `Initial-${item.sku}`
      }))

    if (inventoryLogs.length > 0) {
      await prisma.inventoryLog.createMany({
        data: inventoryLogs
      })
    }

    // Revalidate pages
    revalidatePath('/inventory')
    revalidatePath('/inventory/add')

    return { 
      success: true, 
      message: `Successfully created ${createdItems.count} items`,
      count: createdItems.count
    }
  } catch (error) {
    console.error('Create bulk inventory items error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create inventory items' 
    }
  }
}

// New function for QuickAddMultiple component - accepts array directly
export async function createMultipleInventoryItems(itemsData: Array<{
  name: string
  categoryId: string
  supplierId?: string | null
  unit: string
  costPrice: number
  currentStock: number
  reorderLevel: number
  description?: string | null
}>) {
  try {
    // Validation
    if (!itemsData || itemsData.length === 0) {
      throw new Error('No items provided')
    }

    // Check for duplicate names
    const names = itemsData.map(item => item.name.trim().toLowerCase())
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
    if (duplicateNames.length > 0) {
      throw new Error(`Duplicate item names found: ${duplicateNames.join(', ')}`)
    }

    // Check if any names already exist in database
    const existingItems = await prisma.item.findMany({
      where: {
        name: {
          in: itemsData.map(item => item.name.trim())
        }
      },
      select: { name: true }
    })

    if (existingItems.length > 0) {
      throw new Error(`Items already exist: ${existingItems.map(item => item.name).join(', ')}`)
    }

    // Get admin user for inventory logs
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      throw new Error('No admin user found. Please run database seeding first.')
    }

    // Process each item individually to match the working createInventoryItem function
    const createdItems = []

    for (const itemData of itemsData) {
      // Validate individual item
      if (itemData.costPrice <= 0) {
        throw new Error(`Cost price must be greater than 0 for item: ${itemData.name}`)
      }
      if (itemData.currentStock < 0 || itemData.reorderLevel < 0) {
        throw new Error(`Stock quantities cannot be negative for item: ${itemData.name}`)
      }

      // Generate SKU
      const category = await prisma.category.findUnique({
        where: { id: itemData.categoryId },
        select: { name: true }
      })
      
      let sku = ''
      if (category) {
        const categoryPrefix = category.name.substring(0, 3).toUpperCase()
        const itemCount = await prisma.item.count({
          where: { categoryId: itemData.categoryId }
        })
        sku = `${categoryPrefix}-${String(itemCount + createdItems.length + 1).padStart(3, '0')}`
      } else {
        sku = `ITM-${String(Date.now() + createdItems.length).slice(-6)}`
      }

      // Create the item using the same pattern as the working function
      const newItem = await prisma.item.create({
        data: {
          name: itemData.name.trim(),
          sku,
          categoryId: itemData.categoryId,
          supplierId: itemData.supplierId || null,
          unit: itemData.unit.trim(),
          costPrice: itemData.costPrice,
          // No selling price for ingredients/stock items
          currentStock: itemData.currentStock,
          reorderLevel: itemData.reorderLevel,
          description: itemData.description || null,
          isActive: true
        }
      })

      createdItems.push(newItem)

      // Create inventory log if there's initial stock (same as working function)
      if (itemData.currentStock > 0) {
        await prisma.inventoryLog.create({
          data: {
            itemId: newItem.id,
            userId: adminUser.id,
            type: 'STOCK_IN',
            quantity: itemData.currentStock,
            previousStock: 0,
            newStock: itemData.currentStock,
            reason: 'Initial stock entry (bulk)',
            reference: `Bulk-Initial-${newItem.sku}`
          }
        })
      }
    }

    // Revalidate pages
    revalidatePath('/inventory')
    revalidatePath('/inventory/add')

    return { 
      success: true, 
      message: `Successfully created ${createdItems.length} items`,
      count: createdItems.length,
      items: createdItems.map(item => ({ id: item.id, name: item.name, sku: item.sku }))
    }
  } catch (error) {
    console.error('Create multiple inventory items error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create inventory items' 
    }
  }
}

// Update inventory item with ID and data object
export async function updateInventoryItem(itemId: string, updateData: {
  name: string
  sku: string
  description: string | null
  unit: string
  costPrice: number | null
  minStockLevel: number | null
  currentStock: number
  categoryId: string
  supplierId: string | null
  expiryDate: Date | null
  location: string | null
  barcode: string | null
}) {
  try {
    // Validation
    if (!itemId || !updateData.name || !updateData.categoryId || !updateData.unit) {
      return { success: false, message: 'Required fields are missing' }
    }

    if (updateData.costPrice !== null && updateData.costPrice <= 0) {
      return { success: false, message: 'Cost price must be greater than 0' }
    }

    if (updateData.minStockLevel !== null && updateData.minStockLevel < 0) {
      return { success: false, message: 'Minimum stock level cannot be negative' }
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return { success: false, message: 'Item not found' }
    }

    // Check for duplicate name
    if (updateData.name !== existingItem.name) {
      const duplicateName = await prisma.item.findFirst({
        where: {
          AND: [
            { name: updateData.name.trim() },
            { id: { not: itemId } }
          ]
        }
      })

      if (duplicateName) {
        return { success: false, message: 'An item with this name already exists' }
      }
    }

    // Check for duplicate SKU
    if (updateData.sku !== existingItem.sku) {
      const duplicateSku = await prisma.item.findFirst({
        where: {
          AND: [
            { sku: updateData.sku.trim() },
            { id: { not: itemId } }
          ]
        }
      })

      if (duplicateSku) {
        return { success: false, message: 'An item with this SKU already exists' }
      }
    }

    // Check if stock level changed - if so, create inventory log
    const stockChanged = updateData.currentStock !== existingItem.currentStock

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: updateData.name.trim(),
        sku: updateData.sku.trim(),
        description: updateData.description,
        unit: updateData.unit,
        costPrice: updateData.costPrice || 0,
        // No selling price for ingredients/stock items
        reorderLevel: updateData.minStockLevel || 0,
        currentStock: updateData.currentStock,
        categoryId: updateData.categoryId,
        supplierId: updateData.supplierId,
        // Note: expiryDate, location, barcode are not in current schema
        updatedAt: new Date()
      }
    })

    // Create inventory log if stock changed
    if (stockChanged) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })

      if (adminUser) {
        await prisma.inventoryLog.create({
          data: {
            itemId: itemId,
            userId: adminUser.id,
            type: 'ADJUSTMENT',
            quantity: updateData.currentStock - existingItem.currentStock,
            previousStock: existingItem.currentStock,
            newStock: updateData.currentStock,
            reason: 'Stock updated via edit form'
          }
        })
      }
    }

    revalidatePath('/inventory')
    revalidatePath(`/inventory/edit/${itemId}`)

    return { 
      success: true, 
      message: 'Item updated successfully',
      itemId: updatedItem.id
    }
  } catch (error) {
    console.error('Update inventory item error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update item'
    }
  }
}

// Original FormData version for compatibility
export async function updateInventoryItemForm(formData: FormData) {
  try {
    const itemId = formData.get('itemId') as string
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const categoryId = formData.get('categoryId') as string
    const supplierId = formData.get('supplierId') as string || null
    const unit = formData.get('unit') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const reorderLevel = parseFloat(formData.get('reorderLevel') as string)
    const description = formData.get('description') as string || null
    const brand = formData.get('brand') as string || null
    const grade = formData.get('grade') as string || null
    const specification = formData.get('specification') as string || null
    const packSize = formData.get('packSize') as string || null

    // Validation
    if (!itemId || !name || !categoryId || !unit || isNaN(costPrice) || isNaN(reorderLevel)) {
      throw new Error('Required fields are missing or invalid')
    }

    if (costPrice <= 0) {
      throw new Error('Cost price must be greater than 0')
    }

    if (reorderLevel < 0) {
      throw new Error('Reorder level cannot be negative')
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      throw new Error('Item not found')
    }

    // Check if name is already used by another item
    const duplicateName = await prisma.item.findFirst({
      where: {
        AND: [
          { name: name.trim() },
          { id: { not: itemId } }
        ]
      }
    })

    if (duplicateName) {
      throw new Error('An item with this name already exists')
    }

    // Check if SKU is already used by another item
    if (sku && sku !== existingItem.sku) {
      const duplicateSku = await prisma.item.findFirst({
        where: {
          AND: [
            { sku: sku.trim() },
            { id: { not: itemId } }
          ]
        }
      })

      if (duplicateSku) {
        throw new Error('An item with this SKU already exists')
      }
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: name.trim(),
        sku: sku?.trim() || existingItem.sku,
        categoryId,
        supplierId,
        unit,
        costPrice,
        // No selling price for ingredients/stock items
        reorderLevel,
        description,
        brand,
        grade,
        specification,
        packSize,
        updatedAt: new Date()
      }
    })

    // Revalidate the pages that show items
    revalidatePath('/inventory')
    revalidatePath(`/inventory/edit/${itemId}`)

    return { 
      success: true, 
      message: `Item "${name}" updated successfully`,
      itemId: updatedItem.id
    }
  } catch (error) {
    console.error('Update inventory item error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update inventory item' 
    }
  }
}

export async function deleteInventoryItem(itemId: string) {
  try {
    // Input validation
    if (!itemId || typeof itemId !== 'string') {
      return { 
        success: false, 
        message: 'Invalid item ID provided. Please refresh the page and try again.' 
      }
    }

    if (itemId.length < 1) {
      return { 
        success: false, 
        message: 'Item ID cannot be empty.' 
      }
    }

    // Check if item exists and get related data
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        inventoryLogs: true,
        purchaseItems: true,
        orderItems: true,
        recipeItems: true,
        stockUsage: true
      }
    })

    if (!existingItem) {
      return { 
        success: false, 
        message: 'This item no longer exists. It may have already been deleted by another user.' 
      }
    }

    // Check if item is already inactive
    if (!existingItem.isActive) {
      return { 
        success: false, 
        message: 'This item is already deactivated.' 
      }
    }

    // Check if item has related records
    const hasInventoryLogs = existingItem.inventoryLogs.length > 0
    const hasPurchases = existingItem.purchaseItems.length > 0
    const hasOrders = existingItem.orderItems.length > 0
    const hasRecipeItems = existingItem.recipeItems.length > 0
    const hasStockUsage = existingItem.stockUsage.length > 0
    
    const hasRelatedRecords = hasInventoryLogs || hasPurchases || hasOrders || hasRecipeItems || hasStockUsage

    if (hasRelatedRecords) {
      // Soft delete - mark as inactive instead of hard delete
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      // Create inventory log for deactivation
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })

      if (adminUser) {
        try {
          await prisma.inventoryLog.create({
            data: {
              itemId: itemId,
              userId: adminUser.id,
              type: 'ADJUSTMENT',
              quantity: 0,
              previousStock: existingItem.currentStock,
              newStock: existingItem.currentStock,
              reason: 'Item deactivated via delete operation'
            }
          })
        } catch (logError) {
          console.warn('Failed to create inventory log for deactivation:', logError)
          // Don't fail the main operation if logging fails
        }
      }

      // Revalidate pages
      revalidatePath('/inventory')

      const relatedRecordsText = [
        hasInventoryLogs && `${existingItem.inventoryLogs.length} inventory logs`,
        hasPurchases && `${existingItem.purchaseItems.length} purchase records`,
        hasOrders && `${existingItem.orderItems.length} order items`,
        hasRecipeItems && `${existingItem.recipeItems.length} recipe connections`,
        hasStockUsage && `${existingItem.stockUsage.length} stock usage records`
      ].filter(Boolean).join(', ')

      return { 
        success: true, 
        message: `Item "${existingItem.name}" has been deactivated because it has related records (${relatedRecordsText}). You can reactivate it later if needed.`,
        isDeactivated: true
      }
    } else {
      // Hard delete if no related records
      try {
        await prisma.item.delete({
          where: { id: itemId }
        })
      } catch (deleteError: any) {
        if (deleteError?.code === 'P2003') {
          // Foreign key constraint error - there are related records we didn't detect
          return { 
            success: false, 
            message: 'Cannot delete item because it has related records. Please try deactivating it instead.' 
          }
        }
        throw deleteError
      }

      // Revalidate pages
      revalidatePath('/inventory')

      return { 
        success: true, 
        message: `Item "${existingItem.name}" has been permanently deleted.`,
        isDeactivated: false
      }
    }
  } catch (error: any) {
    console.error('Delete inventory item error:', error)
    
    // Handle specific database errors
    if (error?.code === 'P2025') {
      return { 
        success: false, 
        message: 'Item not found. It may have already been deleted.' 
      }
    } else if (error?.code === 'P2003') {
      return { 
        success: false, 
        message: 'Cannot delete item because it has related records. Please deactivate it instead.' 
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

export async function toggleItemStatus(itemId: string) {
  try {
    // Input validation
    if (!itemId || typeof itemId !== 'string') {
      return { 
        success: false, 
        message: 'Invalid item ID provided. Please refresh the page and try again.' 
      }
    }

    // Get current item status
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return { 
        success: false, 
        message: 'This item no longer exists. It may have been deleted by another user.' 
      }
    }

    const newStatus = !existingItem.isActive
    const actionText = newStatus ? 'activated' : 'deactivated'

    // Toggle the status
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        isActive: newStatus,
        updatedAt: new Date()
      }
    })

    // Create inventory log for status change
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (adminUser) {
      try {
        await prisma.inventoryLog.create({
          data: {
            itemId: itemId,
            userId: adminUser.id,
            type: 'ADJUSTMENT',
            quantity: 0,
            previousStock: existingItem.currentStock,
            newStock: existingItem.currentStock,
            reason: `Item ${actionText} via status toggle`
          }
        })
      } catch (logError) {
        console.warn('Failed to create inventory log for status change:', logError)
        // Don't fail the main operation if logging fails
      }
    }

    // Revalidate pages
    revalidatePath('/inventory')
    revalidatePath(`/inventory/edit/${itemId}`)

    return { 
      success: true, 
      message: `"${existingItem.name}" has been successfully ${actionText}.`,
      isActive: updatedItem.isActive
    }
  } catch (error: any) {
    console.error('Toggle item status error:', error)
    
    // Handle specific database errors
    if (error?.code === 'P2025') {
      return { 
        success: false, 
        message: 'Item not found. It may have already been deleted.' 
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
          'An unexpected error occurred while updating item status. Please try again.'
      }
    }
  }
}
