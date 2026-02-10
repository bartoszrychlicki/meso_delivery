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
  onCategoryChange?: (slug: string) => void
  className?: string
  useLinks?: boolean // New prop
}

import Link from 'next/link'

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange = () => { },
  className,
  useLinks = false,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const activeElement = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = activeElement.getBoundingClientRect()

      const scrollLeft = elementRect.left - containerRect.left - containerRect.width / 2 + elementRect.width / 2
      container.scrollBy({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [activeCategory])

  const renderContent = (category: Category, isActive: boolean) => (
    <>
      {category.icon && <span className="text-xl">{category.icon}</span>}
      <div>
        <p className="font-medium">{category.name}</p>
        {category.name_jp && (
          <p className="text-xs opacity-60 font-japanese">{category.name_jp}</p>
        )}
      </div>
    </>
  )

  const getItemClass = (isActive: boolean, isMobile: boolean) => {
    if (isMobile) {
      return cn(
        'flex-shrink-0 px-5 py-2.5 rounded-full text-base font-medium transition-all whitespace-nowrap',
        isActive
          ? 'bg-meso-red-500 text-white shadow-[0_0_12px_rgba(244,37,175,0.5)]'
          : 'bg-white/5 text-white/70 border border-meso-red-500/20 hover:border-meso-red-500/50 hover:text-white'
      )
    }
    return cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
      isActive
        ? 'bg-meso-red-500 text-white shadow-[0_0_15px_rgba(244,37,175,0.4)]'
        : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent hover:border-meso-red-500/20'
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Mobile: Horizontal scroll */}
      <div
        ref={scrollRef}
        className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.slug
          if (useLinks) {
            const href = category.slug === 'home' ? '/' : `/menu?category=${category.slug}`
            return (
              <Link
                key={category.id}
                href={href}
                ref={isActive ? (activeRef as React.RefObject<HTMLAnchorElement>) : null}
                className={getItemClass(isActive, true)}
              >
                {category.name}
              </Link>
            )
          }
          return (
            <button
              key={category.id}
              ref={isActive ? (activeRef as React.RefObject<HTMLButtonElement>) : null}
              onClick={() => onCategoryChange(category.slug)}
              className={getItemClass(isActive, true)}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:flex flex-col gap-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.slug
          if (useLinks) {
            const href = category.slug === 'home' ? '/' : `/menu?category=${category.slug}`
            return (
              <Link
                key={category.id}
                href={href}
                className={getItemClass(isActive, false)}
              >
                {renderContent(category, isActive)}
              </Link>
            )
          }
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              className={getItemClass(isActive, false)}
            >
              {renderContent(category, isActive)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
