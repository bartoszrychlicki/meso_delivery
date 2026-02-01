'use client'

import { useEffect, useState } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  hideHeader?: boolean
  hideBottomNav?: boolean
  className?: string
}

export function AppLayout({
  children,
  hideHeader = false,
  hideBottomNav = false,
  className,
}: AppLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const cartItemCount = useCartStore((state) => state.getItemCount())

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const displayCartCount = mounted ? cartItemCount : 0

  return (
    <div className={cn('min-h-screen bg-meso-dark-950 text-white flex flex-col', className)}>
      {!hideHeader && (
        <Header cartItemCount={displayCartCount} locationName="Gdańsk" />
      )}

      <main className={cn(
        'flex-1',
        !hideBottomNav && 'pb-20 lg:pb-0' // Space for bottom nav on mobile
      )}>
        {children}
      </main>

      {!hideBottomNav && <BottomNav cartItemCount={displayCartCount} />}
    </div>
  )
}
