'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface MenuItemImageProps {
  src?: string
  alt: string
  className?: string
}

export default function MenuItemImage({ src, alt, className = "w-full h-full object-cover" }: MenuItemImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center text-gray-400">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-xs">No Image</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true)
          setIsLoading(false)
        }}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  )
}