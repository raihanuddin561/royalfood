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

// Helper function to generate safe filename
function generateSafeFilename(originalName: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const uuid = uuidv4().split('-')[0]
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.]/g, '-')
    .toLowerCase()
    .substring(0, 20)
  
  return `menu-items/${sanitizedName}-${timestamp}-${uuid}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.'
      }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 })
    }

    // Validate the file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    // Generate safe filename with folder structure
    const filename = generateSafeFilename(file.name)
    
    try {
      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({
        success: true,
        imageUrl: blob.url,
        filename: filename,
        size: file.size,
        type: file.type,
        downloadUrl: blob.downloadUrl
      })

    } catch (uploadError) {
      console.error('Vercel Blob upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Failed to upload image to blob storage'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to upload image'
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