'use client'

import { useState } from 'react'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import { Footer } from './Footer'
import { TestBanner } from './TestBanner'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  hideBottomNav?: boolean
  hideFooter?: boolean
  className?: string
}

export function AppLayout({
  children,
  hideBottomNav = false,
  hideFooter = false,
  className,
}: AppLayoutProps) {
  const [bannerVisible, setBannerVisible] = useState(true)

  return (
    <div className={cn('min-h-screen bg-background text-foreground flex flex-col', className)}>
      {bannerVisible && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <TestBanner onDismiss={() => setBannerVisible(false)} />
        </div>
      )}
      <DesktopNav topOffset={bannerVisible} />

      <main className={cn(
        'flex-1',
        bannerVisible ? 'pt-10 lg:pt-[calc(2.5rem+4rem)]' : 'lg:pt-16',
        !hideBottomNav && 'pb-20 lg:pb-0'
      )}>
        {children}
      </main>

      {!hideFooter && <div className="hidden lg:block"><Footer /></div>}

      {!hideBottomNav && <MobileNav />}
    </div>
  )
}
