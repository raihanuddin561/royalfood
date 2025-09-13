'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (imageUrl: string) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

export default function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  disabled = false,
  className = '' 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      setIsUploading(true)

      // Validate file size and type on client side
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        setPreview(value || null)
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, and WebP images are allowed')
        setPreview(value || null)
        return
      }

      // Upload to server
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        onChange(result.imageUrl)
        setPreview(result.imageUrl)
        toast.success('Image uploaded successfully')
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setPreview(value || null)
    } finally {
      setIsUploading(false)
      // Clean up object URL
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // For Vercel Blob, we need to pass the full URL
      const response = await fetch(`/api/upload/image?url=${encodeURIComponent(value)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setPreview(null)
        onRemove?.()
        onChange('')
        toast.success('Image removed')
      } else {
        const result = await response.json()
        throw new Error(result.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        <Card className="relative group">
          <CardContent className="p-4">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={preview}
                alt="Menu item preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            {!disabled && (
              <div className="flex justify-between items-center mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Image
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-dashed border-2 ${disabled ? 'border-gray-200' : 'border-gray-300 hover:border-gray-400'} cursor-pointer transition-colors`}
          onClick={handleUploadClick}
        >
          <CardContent className="p-8">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, WebP up to 5MB
                </p>
              </div>
              {isUploading && (
                <div className="mt-4">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}