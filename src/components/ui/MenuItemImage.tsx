'use client'

interface MenuItemImageProps {
  src?: string
  alt: string
  className?: string
}

export default function MenuItemImage({ src, alt, className = "w-full h-full object-cover" }: MenuItemImageProps) {
  if (!src) {
    return <span className="text-gray-400 text-sm">No Image</span>
  }

  return (
    <>
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onError={(e) => {
          console.error('🖼️ [MENU_ITEM_IMAGE] Image failed to load:', src)
          e.currentTarget.style.display = 'none'
          if (e.currentTarget.nextElementSibling) {
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
          }
        }}
      />
      <div className="hidden w-full h-full items-center justify-center bg-gray-100">
        <span className="text-gray-400 text-sm">Image Failed to Load</span>
      </div>
    </>
  )
}