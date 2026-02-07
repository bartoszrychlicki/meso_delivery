'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, MapPin, Menu, LogIn, UserPlus, LogOut } from 'lucide-react'
import { MesoLogo } from '@/components/brand/MesoLogo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  cartItemCount?: number
  locationName?: string
  className?: string
  hideOnMobile?: boolean
}

export function Header({
  cartItemCount = 0,
  locationName = 'Gdańsk',
  className,
  hideOnMobile = false
}: HeaderProps) {
  const pathname = usePathname()
  const { isAnonymous, isPermanent, isLoading, signOut, user } = useAuth()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/orders', label: 'Zamówienia' },
  ]

  // Get user display name for permanent users
  const userDisplayName = isPermanent
    ? user?.user_metadata?.name || user?.email?.split('@')[0] || 'Konto'
    : null

  return (
    <header className={cn(
      'sticky top-0 z-50 backdrop-blur-sm border-b border-meso-red-500/20',
      'bg-meso-dark-900/80',
      className
    )}>
      {/* Mobile Header */}
      {!hideOnMobile && (
        <div className="lg:hidden flex items-center justify-between px-4 h-14">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-meso-dark-900 border-meso-red-500/20 w-72">
              <div className="flex flex-col gap-6 mt-8">
                <MesoLogo size="lg" />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'text-lg transition-colors',
                        pathname === link.href
                          ? 'text-meso-red-500'
                          : 'text-white/70 hover:text-white'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-meso-red-500/20 pt-4 space-y-3">
                  {isLoading ? (
                    <div className="text-white/50">Ładowanie...</div>
                  ) : isPermanent ? (
                    <>
                      <Link
                        href="/account"
                        className="flex items-center gap-2 text-white/70 hover:text-white"
                      >
                        <User className="w-4 h-4" />
                        {userDisplayName}
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 text-white/50 hover:text-white text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Wyloguj się
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/account/upgrade"
                        className="flex items-center gap-2 text-meso-gold-400 hover:text-meso-gold-300"
                      >
                        <UserPlus className="w-4 h-4" />
                        Załóż konto
                      </Link>
                      <Link
                        href="/login"
                        className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Mam już konto
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <MesoLogo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-meso-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-[0_0_8px_rgba(244,37,175,0.6)]">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 xl:px-12 h-16">
        <Link href="/">
          <MesoLogo size="lg" />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-meso-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-[0_0_8px_rgba(244,37,175,0.6)]">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Button>
          </Link>

          {isLoading ? (
            <div className="w-24 h-9 bg-meso-dark-800 rounded animate-pulse" />
          ) : isPermanent ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-meso-red-500 flex items-center justify-center text-xs font-bold">
                    {userDisplayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:inline">{userDisplayName}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-white/50 hover:text-white"
                title="Wyloguj się"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/account/upgrade">
                <Button
                  variant="outline"
                  className="border-meso-gold-500/30 text-meso-gold-400 hover:bg-meso-gold-500/10 hover:border-meso-gold-500/50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Załóż konto
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Zaloguj
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
