'use client'

import { BottomNav } from '@/components/layout/BottomNav'
import { useCartStore } from '@/stores/cartStore'
import { useEffect, useState } from 'react'

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const cartItemCount = useCartStore((state) => state.getItemCount())

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayCartCount = mounted ? cartItemCount : 0

  return (
    <div className="min-h-screen bg-meso-dark-900 text-white flex flex-col">
      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav cartItemCount={displayCartCount} />
    </div>
  )
}
