'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { ProductDrawer } from './ProductDrawer'

interface Product {
  id: string
  name: string
  name_jp?: string
  slug: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  is_spicy?: boolean
  spice_level?: 1 | 2 | 3
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_bestseller?: boolean
  is_signature?: boolean
  is_new?: boolean
  has_variants?: boolean
  has_addons?: boolean
  has_spice_level?: boolean
}

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDrawerOpen(true)
  }

  const handleCardClick = () => {
    setIsDrawerOpen(true)
  }



  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'group flex flex-col rounded-xl overflow-hidden cursor-pointer',
          'bg-white/5 border border-meso-red-500/20',
          'shadow-lg hover:border-meso-red-500',
          'transition-all duration-200',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-60 w-full bg-meso-dark-800 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-meso-dark-800 to-meso-dark-900">
              <span className="text-6xl">🍜</span>
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 rounded-lg bg-meso-red-500 px-2 py-1 text-sm font-bold text-white shadow-lg">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col p-4 gap-2">
          <p className="text-white text-xl font-bold leading-tight">
            {product.name}
          </p>

          {product.description && (
            <p className="text-zinc-400 text-base font-normal leading-tight line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price and Add Button */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              {hasDiscount && (
                <p className="text-white/40 text-base font-medium leading-tight line-through">
                  {formatPrice(product.original_price!)}
                </p>
              )}
              <p className="text-meso-red-500 text-2xl font-bold leading-tight">
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              onClick={handleQuickAdd}
              className={cn(
                'flex min-w-[120px] cursor-pointer items-center justify-center',
                'overflow-hidden rounded-full h-12 px-6',
                'bg-meso-red-500 text-white text-xl font-bold',
                'hover:bg-meso-red-600 active:scale-95',
                'transition-all duration-150',
                'shadow-[0_0_15px_rgba(244,37,175,0.4)]',
                'hover:shadow-[0_0_20px_rgba(244,37,175,0.6)]'
              )}
            >
              <Plus className="w-5 h-5 mr-1" />
              <span className="truncate">DODAJ</span>
            </button>
          </div>
        </div>
      </div>

      <ProductDrawer
        productSlug={product.slug}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        initialData={product}
      />
    </>
  )
}
