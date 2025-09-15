import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CartIconProps {
  itemCount: number
  className?: string
  onClick?: () => void
  href?: string
  variant?: 'default' | 'floating'
}

export function CartIcon({ itemCount, className = '', onClick, href = '/public/order', variant = 'default' }: CartIconProps) {
  // Define styles based on variant
  const variantStyles = {
    default: "bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-700",
    floating: "bg-gradient-to-r from-orange-500 to-red-500 border-2 border-orange-600 text-white hover:from-orange-600 hover:to-red-600 shadow-xl hover:shadow-2xl"
  }

  const CartButton = (
    <Button
      variant={variant === 'floating' ? 'default' : 'outline'}
      size="icon"
      className={`relative font-semibold transition-all duration-200 ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      title={itemCount > 0 ? `View Cart (${itemCount} items)` : 'View Cart'}
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-6 flex items-center justify-center px-1.5 shadow-lg ring-2 ring-white">
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