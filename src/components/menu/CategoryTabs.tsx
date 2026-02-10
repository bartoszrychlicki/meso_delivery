'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  name_jp?: string
  slug: string
  icon?: string
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (slug: string) => void
  className?: string
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const activeButton = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      const scrollLeft = buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2
      container.scrollBy({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [activeCategory])

  return (
    <div className={cn('relative', className)}>
      {/* Mobile: Horizontal scroll */}
      <div
        ref={scrollRef}
        className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            ref={activeCategory === category.slug ? activeRef : null}
            onClick={() => onCategoryChange(category.slug)}
            className={cn(
              'flex-shrink-0 px-5 py-2.5 rounded-full text-base font-medium transition-all whitespace-nowrap',
              activeCategory === category.slug
                ? 'bg-meso-red-500 text-white shadow-[0_0_12px_rgba(244,37,175,0.5)]'
                : 'bg-white/5 text-white/70 border border-meso-red-500/20 hover:border-meso-red-500/50 hover:text-white'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:flex flex-col gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.slug)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
              activeCategory === category.slug
                ? 'bg-meso-red-500 text-white shadow-[0_0_15px_rgba(244,37,175,0.4)]'
                : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent hover:border-meso-red-500/20'
            )}
          >
            {category.icon && <span className="text-xl">{category.icon}</span>}
            <div>
              <p className="font-medium">{category.name}</p>
              {category.name_jp && (
                <p className="text-xs opacity-60 font-japanese">{category.name_jp}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
