import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

// Helper function to validate image file
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB (Vercel Blob supports larger files)

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.'
    }
  }

  return { valid: true }
}

// Helper function to generate safe filename with item name/ID
function generateSafeFilename(originalName: string, itemName?: string, itemId?: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const uuid = uuidv4().split('-')[0]
  
  // Create a base name from item name or ID if provided
  let baseName = ''
  if (itemName) {
    baseName = itemName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .toLowerCase()
      .substring(0, 30) // Limit length
  } else if (itemId) {
    baseName = `item-${itemId}`
  } else {
    baseName = originalName
      .replace(/[^a-zA-Z0-9.]/g, '-')
      .toLowerCase()
      .substring(0, 20)
  }
  
  return `menu-items/${baseName}-${timestamp}-${uuid}.${extension}`
}

export async function POST(request: NextRequest) {
  console.log('🚀 [IMAGE_UPLOAD] Starting image upload request')
  
  try {
    // Check if BLOB_READ_WRITE_TOKEN is configured
    console.log('🔑 [IMAGE_UPLOAD] Checking blob token configuration...')
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ [IMAGE_UPLOAD] BLOB_READ_WRITE_TOKEN not configured')
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.'
      }, { status: 500 })
    }
    console.log('✅ [IMAGE_UPLOAD] Blob token is configured')

    console.log('📄 [IMAGE_UPLOAD] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('image') as File
    const itemName = formData.get('itemName') as string
    const itemId = formData.get('itemId') as string

    console.log('📋 [IMAGE_UPLOAD] Upload context:', {
      itemName: itemName || 'not provided',
      itemId: itemId || 'not provided'
    })

    if (!file) {
      console.error('❌ [IMAGE_UPLOAD] No image file provided in form data')
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 })
    }

    console.log(`📋 [IMAGE_UPLOAD] File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Validate the file
    console.log('🔍 [IMAGE_UPLOAD] Validating file...')
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.error(`❌ [IMAGE_UPLOAD] File validation failed: ${validation.error}`)
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }
    console.log('✅ [IMAGE_UPLOAD] File validation passed')

    // Generate safe filename with item context
    const filename = generateSafeFilename(file.name, itemName, itemId)
    console.log(`🏷️ [IMAGE_UPLOAD] Generated filename: ${filename}`)
    console.log(`📝 [IMAGE_UPLOAD] Filename context: itemName="${itemName}", itemId="${itemId}"`)
    
    try {
      console.log('☁️ [IMAGE_UPLOAD] Uploading to Vercel Blob...')
      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      console.log(`✅ [IMAGE_UPLOAD] Upload successful! URL: ${blob.url}`)
      return NextResponse.json({
        success: true,
        imageUrl: blob.url,
        filename: filename,
        size: file.size,
        type: file.type,
        downloadUrl: blob.downloadUrl,
        itemContext: { itemName, itemId } // Include context in response
      })

    } catch (uploadError) {
      console.error('💥 [IMAGE_UPLOAD] Vercel Blob upload error:', uploadError)
      console.error('Upload error details:', {
        message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        stack: uploadError instanceof Error ? uploadError.stack : undefined
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to upload image to blob storage',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 [IMAGE_UPLOAD] General error in image upload:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE endpoint to remove images from Vercel Blob
export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured'
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const blobUrl = searchParams.get('url')

    if (!blobUrl) {
      return NextResponse.json({
        success: false,
        error: 'Blob URL is required'
      }, { status: 400 })
    }

    try {
      await del(blobUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully'
      })
    } catch (deleteError) {
      console.error('Vercel Blob delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete image from blob storage'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Image deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete image'
    }, { status: 500 })
  }
}