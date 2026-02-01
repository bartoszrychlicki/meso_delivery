'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cartStore'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  name_jp?: string
  slug: string
  description?: string
  price: number
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
  const addItem = useCartStore((state) => state.addItem)

  const hasOptions = product.has_variants || product.has_addons || product.has_spice_level

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasOptions) {
      window.location.href = `/menu/${product.slug}`
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url,
      addons: [],
    })

    toast.success(`${product.name} dodano do koszyka`, {
      duration: 2000,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price)
  }

  return (
    <Link
      href={`/menu/${product.slug}`}
      className={cn(
        'group flex flex-col rounded-xl overflow-hidden',
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
          <p className="text-meso-red-500 text-2xl font-bold leading-tight">
            {formatPrice(product.price)}
          </p>
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
    </Link>
  )
}
