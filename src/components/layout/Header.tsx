'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, MapPin, Menu } from 'lucide-react'
import { MesoLogo } from '@/components/brand/MesoLogo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface HeaderProps {
  cartItemCount?: number
  locationName?: string
  className?: string
}

export function Header({ cartItemCount = 0, locationName = 'Gdańsk', className }: HeaderProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/menu', label: 'Menu' },
    { href: '/about', label: 'O nas' },
    { href: '/contact', label: 'Kontakt' },
  ]

  return (
    <header className={cn(
      'sticky top-0 z-50 backdrop-blur-sm border-b border-meso-red-500/20',
      'bg-meso-dark-900/80',
      className
    )}>
      {/* Mobile Header */}
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
              <div className="border-t border-meso-red-500/20 pt-4">
                <Link href="/login" className="text-white/70 hover:text-white">
                  Zaloguj się
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <MesoLogo size="md" />
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white text-xs gap-1 px-2">
            <MapPin className="w-3 h-3" />
            <span className="max-w-16 truncate">{locationName}</span>
          </Button>

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

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 xl:px-12 h-16">
        <Link href="/">
          <MesoLogo size="lg" />
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-meso-red-500'
                  : 'text-white/70 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white/70 hover:text-white gap-2">
            <MapPin className="w-4 h-4" />
            <span>{locationName}</span>
          </Button>

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

          <Link href="/login">
            <Button
              variant="outline"
              className="border-meso-red-500/30 text-white hover:bg-meso-red-500/10 hover:border-meso-red-500/50"
            >
              <User className="w-4 h-4 mr-2" />
              Zaloguj się
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
