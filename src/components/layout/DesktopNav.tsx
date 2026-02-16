'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ClipboardList, User, Trophy, ShoppingCart, LogIn, LogOut, UserPlus } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useUserDisplay } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Menu', icon: Home },
  { path: '/search', label: 'Szukaj', icon: Search },
  { path: '/orders', label: 'Zamówienia', icon: ClipboardList },
  { path: '/loyalty', label: 'Punkty', icon: Trophy },
  { path: '/account', label: 'Profil', icon: User },
]

export function DesktopNav() {
  const pathname = usePathname()
  const { isPermanent, isLoading, signOut } = useAuth()
  const { displayName, avatarInitial } = useUserDisplay()
  const totalItems = useCartStore((s) => s.getItemCount())
  const subtotal = useCartStore((s) => s.getSubtotal())

  return (
    <header className="fixed top-0 left-0 right-0 z-40 hidden lg:block glass border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-widest text-primary neon-text"
        >
          MESO
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.path ||
              (item.path !== '/' && pathname.startsWith(item.path))

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side: Cart + Auth */}
        <div className="flex items-center gap-3">
          {/* Cart button */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 neon-border"
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 ? (
              <>
                <span>{formatPrice(subtotal)}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {totalItems}
                </span>
              </>
            ) : (
              <span>Koszyk</span>
            )}
          </Link>

          {/* Auth */}
          {isLoading ? (
            <div className="w-24 h-9 bg-card rounded animate-pulse" />
          ) : isPermanent ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {avatarInitial}
                  </div>
                  <span className="hidden xl:inline">{displayName}</span>
                </button>
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                title="Wyloguj się"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/register">
                <button className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary hover:border-primary transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Załóż konto
                </button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <LogIn className="w-4 h-4" />
                  Zaloguj
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
