'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Heart, 
  Star, 
  Clock, 
  Zap, 
  ChefHat 
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency-config'
import MenuItemImage from '@/components/ui/MenuItemImage'

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string
  mealTypes?: string[]
  prepTime?: number
  isAvailable: boolean
  rating?: number
  isPopular?: boolean
  isNew?: boolean
}

interface MenuItemCardProps {
  item: MenuItem
  cartQuantity?: number
  onAddToCart: (itemId: string) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveFromCart: (itemId: string) => void
  showOrderNowButton?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

export default function MenuItemCard({
  item,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  showOrderNowButton = false,
  variant = 'default'
}: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleAddToCart = () => {
    if (!item.isAvailable) {
      toast.error(`${item.name} is currently unavailable`)
      return
    }
    onAddToCart(item.id)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveFromCart(item.id)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  if (variant === 'compact') {
    return (
      <Card className={`group transition-all duration-300 border-2 ${
        item.isAvailable 
          ? 'border-gray-200 hover:border-orange-400 hover:shadow-xl bg-white' 
          : 'border-gray-200 bg-gray-50 opacity-75'
      } overflow-hidden`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <MenuItemImage
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Availability Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-lg font-bold">Unavailable</p>
                <p className="text-sm">Currently out of stock</p>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {item.isNew && (
              <Badge className="bg-green-500 text-white text-xs font-bold">New</Badge>
            )}
            {item.isPopular && (
              <Badge className="bg-orange-500 text-white text-xs font-bold">Popular</Badge>
            )}
            {item.mealTypes && item.mealTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.mealTypes.map((mealType, index) => (
                  <Badge key={index} variant="outline" className={`text-xs font-bold ${
                    mealType === 'BREAKFAST' 
                      ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                      : mealType === 'LUNCH'
                      ? 'border-orange-300 text-orange-700 bg-orange-50'
                      : 'border-purple-300 text-purple-700 bg-purple-50'
                  }`}>
                    {mealType.toLowerCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 h-8 w-8 p-0 rounded-full shadow-md"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Title and Category */}
            <div>
              <h3 className={`font-bold text-lg leading-tight mb-2 line-clamp-2 transition-colors ${
                item.isAvailable 
                  ? 'text-gray-900 hover:text-orange-600 cursor-pointer' 
                  : 'text-gray-500'
              }`}>
                {item.name}
              </h3>
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>

            {/* Description */}
            {item.description && (
              <p className={`text-sm leading-relaxed line-clamp-2 ${
                item.isAvailable ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {item.description}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-700">(4.8)</span>
              {item.prepTime && (
                <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.prepTime}min
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-2">
              {item.isAvailable ? (
                <>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="text-sm text-gray-600 line-through">
                    {formatCurrency(Math.round(item.price * 1.25))}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  Price unavailable
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {item.isAvailable ? (
                cartQuantity > 0 ? (
                  <div className="flex items-center justify-center space-x-4 bg-orange-100 rounded-xl p-3 border-2 border-orange-300">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      className="h-8 w-8 p-0 border-2 border-red-500 hover:bg-red-100 text-red-700 hover:text-red-800 hover:border-red-600 bg-white font-bold shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-xl text-orange-800 min-w-[40px] text-center">
                      {cartQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      className="h-8 w-8 p-0 border-2 border-green-500 hover:bg-green-100 text-green-700 hover:text-green-800 hover:border-green-600 bg-white font-bold shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleAddToCart}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    
                    {showOrderNowButton && (
                      <Link href="/public/order">
                        <Button
                          variant="outline"
                          className="w-full h-10 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Order Now
                        </Button>
                      </Link>
                    )}
                  </>
                )
              ) : (
                <Button
                  disabled
                  className="w-full h-12 bg-gray-300 text-gray-500 font-bold cursor-not-allowed rounded-lg"
                >
                  Currently Unavailable
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant (same structure but with availability handling)
  return (
    <Card className={`group transition-all duration-300 border-2 ${
      item.isAvailable 
        ? 'border-gray-200 hover:border-orange-400 hover:shadow-2xl bg-white hover:scale-[1.02]' 
        : 'border-gray-200 bg-gray-50 opacity-75'
    } overflow-hidden transform`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <MenuItemImage
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Availability Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white">
              <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-75" />
              <p className="text-xl font-bold">Unavailable</p>
              <p className="text-sm opacity-90">Currently out of stock</p>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {!item.isAvailable && (
            <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1">
              Out of Stock
            </Badge>
          )}
          {item.isAvailable && item.isNew && (
            <Badge className="bg-green-500 text-white text-xs font-bold px-2 py-1">
              New
            </Badge>
          )}
          {item.isAvailable && item.isPopular && (
            <Badge className="bg-orange-500 text-white text-xs font-bold px-2 py-1">
              Popular
            </Badge>
          )}
          {item.mealTypes && item.mealTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.mealTypes.map((mealType, index) => (
                <Badge key={index} className={`text-xs font-bold px-2 py-1 ${
                  mealType === 'BREAKFAST' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : mealType === 'LUNCH'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 h-10 w-10 p-0 rounded-full shadow-md"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title and Rating */}
          <div>
            <h3 className={`font-bold text-lg leading-tight mb-2 line-clamp-2 transition-colors ${
              item.isAvailable 
                ? 'text-gray-900 hover:text-orange-600 cursor-pointer' 
                : 'text-gray-500'
            }`}>
              {item.name}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">(4.8)</span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className={`text-sm leading-relaxed line-clamp-2 ${
              item.isAvailable ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {item.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline space-x-2">
            {item.isAvailable ? (
              <>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(item.price)}
                </span>
                <span className="text-sm text-gray-600 line-through">
                  {formatCurrency(Math.round(item.price * 1.33))}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-gray-400">
                Price unavailable
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {item.isAvailable ? (
              cartQuantity > 0 ? (
                <div className="flex items-center justify-center space-x-4 bg-orange-100 rounded-xl p-3 border-2 border-orange-300">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(cartQuantity - 1)}
                    className="h-10 w-10 p-0 border-2 border-red-500 hover:bg-red-100 text-red-700 hover:text-red-800 hover:border-red-600 bg-white font-bold shadow-sm"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="font-bold text-2xl text-orange-800 min-w-[50px] text-center">
                    {cartQuantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(cartQuantity + 1)}
                    className="h-10 w-10 p-0 border-2 border-green-500 hover:bg-green-100 text-green-700 hover:text-green-800 hover:border-green-600 bg-white font-bold shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg text-base"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  
                  {showOrderNowButton && (
                    <Link href="/public/order">
                      <Button
                        variant="outline"
                        className="w-full h-11 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg text-base px-4"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Order Now
                      </Button>
                    </Link>
                  )}
                </>
              )
            ) : (
              <div className="space-y-2">
                <Button
                  disabled
                  className="w-full h-12 bg-gray-300 text-gray-500 font-bold cursor-not-allowed rounded-lg"
                >
                  Currently Unavailable
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  This item is temporarily out of stock
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}