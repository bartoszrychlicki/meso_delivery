'use client'

import { useState } from 'react'
import { Search, ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { CategoryTabs, ProductGrid } from '@/components/menu'
import { useCartStore } from '@/stores/cartStore'

interface Category {
  id: string
  name: string
  name_jp?: string
  slug: string
  icon?: string
  description?: string
}

interface Product {
  id: string
  category_id: string
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
  allergens?: string[]
  tags?: string[]
}

interface Location {
  id: string
  name: string
  delivery_time_min: number
  delivery_time_max: number
  min_order_value: number
}

interface MenuClientProps {
  categories: Category[]
  products: Product[]
  location?: Location | null
}

export function MenuClient({ categories, products, location }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const cartItemCount = useCartStore((state) => state.getItemCount())

  // Add "All" category at the beginning
  const allCategories = [
    { id: 'all', name: 'Wszystko', slug: 'all', icon: '🍱' },
    ...categories,
  ]

  // Filter products by search query
  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-meso-dark-900 overflow-x-hidden font-display">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-meso-dark-900/80 backdrop-blur-sm p-4 pb-2 justify-between border-b border-meso-red-500/20">
        <div className="flex w-12 items-center justify-start">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:text-meso-red-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
        <h1
          className="text-white text-lg font-bold leading-tight tracking-widest flex-1 text-center uppercase"
          style={{ textShadow: '0 0 5px rgba(244, 37, 175, 0.5)' }}
        >
          {activeCategory === 'all' ? 'MENU' : allCategories.find(c => c.slug === activeCategory)?.name?.toUpperCase() || 'MENU'}
        </h1>
        <div className="flex w-12 items-center justify-end">
          <Link
            href="/cart"
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white hover:text-meso-red-500 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-meso-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,37,175,0.6)]">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-meso-red-500/70 flex border-none bg-white/5 items-center justify-center pl-4 rounded-l-lg">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-meso-red-500/50 border-none bg-white/5 h-full placeholder:text-white/40 px-4 rounded-l-none pl-2 text-base font-normal leading-normal"
              placeholder="Znajdź swoje ulubione danie..."
            />
          </div>
        </label>
      </div>

      {/* Category navigation */}
      <div className="px-4 lg:hidden">
        <CategoryTabs
          categories={allCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Main content */}
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block sticky top-[72px] h-fit p-4">
          <CategoryTabs
            categories={allCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </aside>

        {/* Products */}
        <main className="flex flex-col gap-6 px-4 pb-6 pt-4">
          <ProductGrid
            products={filteredProducts}
            categories={categories}
            activeCategory={activeCategory}
          />
        </main>
      </div>
    </div>
  )
}
