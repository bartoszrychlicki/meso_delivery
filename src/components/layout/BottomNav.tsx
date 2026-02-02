'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ShoppingCart, User, Receipt, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface BottomNavProps {
  cartItemCount?: number
  className?: string
}

interface NavItem {
  href: string
  icon: typeof Home
  label: string
  badge?: number
}

export function BottomNav({ cartItemCount = 0, className }: BottomNavProps) {
  const pathname = usePathname()
  const { isAnonymous, isPermanent, isLoading } = useAuth()

  // Base nav items (always shown)
  const baseNavItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/cart', icon: ShoppingCart, label: 'Koszyk', badge: cartItemCount },
    { href: '/orders', icon: Receipt, label: 'Zamówienia' },
  ]

  // Auth-dependent items
  const authNavItem: NavItem = isPermanent
    ? { href: '/account', icon: User, label: 'Profil' }
    : { href: '/login', icon: LogIn, label: 'Zaloguj' }

  const navItems = [...baseNavItems, authNavItem]

  return (
    <nav className={cn(
      'lg:hidden fixed bottom-0 left-0 right-0 z-50',
      'bg-meso-dark-900/80 backdrop-blur-sm border-t border-meso-red-500/20',
      'pb-safe',
      className
    )}>
      <div className="flex gap-2 px-4 pb-3 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-end gap-1 rounded-full',
                'transition-colors',
                isActive
                  ? 'text-meso-red-500'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  isActive && 'drop-shadow-[0_0_5px_rgba(244,37,175,0.8)]'
                )}
                style={isActive ? { fill: 'currentColor' } : undefined}
              />
              <p className={cn(
                'text-xs font-medium leading-normal tracking-[0.015em]',
                isActive ? 'text-meso-red-500' : 'text-white/50'
              )}>
                {item.label}
              </p>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 right-1/4 w-4 h-4 bg-meso-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-[0_0_8px_rgba(244,37,175,0.6)]">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
