import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CartIconProps {
  itemCount: number
  className?: string
  onClick?: () => void
  href?: string
}

export function CartIcon({ itemCount, className = '', onClick, href = '/public/order' }: CartIconProps) {
  const CartButton = (
    <Button
      variant="outline"
      size="icon"
      className={`relative bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold transition-all duration-200 ${className}`}
      onClick={onClick}
      title={itemCount > 0 ? `View Cart (${itemCount} items)` : 'View Cart'}
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  )

  if (onClick) {
    return CartButton
  }

  return (
    <Link href={href} className="inline-block" title={itemCount > 0 ? `View Cart (${itemCount} items)` : 'View Cart'}>
      {CartButton}
    </Link>
  )
}