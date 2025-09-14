'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChefHat } from 'lucide-react'

interface SafeImageProps {
  src?: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  fallbackIcon?: React.ReactNode
  width?: number
  height?: number
}

export default function SafeImage({ 
  src, 
  alt, 
  className = '', 
  fill = false, 
  sizes,
  fallbackIcon,
  width,
  height
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // If no src or image error occurred, show fallback
  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
        {fallbackIcon || <ChefHat className="h-8 w-8 text-gray-400" />}
      </div>
    )
  }

  const imageProps = {
    src,
    alt,
    className: `${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`,
    onError: () => {
      console.warn('🖼️ [SAFE_IMAGE] Failed to load image:', src)
      setImageError(true)
    },
    onLoad: () => {
      setImageLoading(false)
    },
    ...(fill ? { fill: true, sizes } : { width, height })
  }

  return (
    <>
      {imageLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
          <div className="animate-pulse">
            <ChefHat className="h-8 w-8 text-gray-300" />
          </div>
        </div>
      )}
      <Image {...imageProps} />
    </>
  )
}