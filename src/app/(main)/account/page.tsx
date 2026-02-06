'use client'

import Link from 'next/link'
import { User, Package, MapPin, Gift, Star, Settings, LogOut, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth, useUserDisplay, useMesoClub } from '@/hooks/useAuth'
import { AnonymousBanner } from '@/components/auth'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { icon: Package, label: 'Moje zamówienia', href: '/account/orders', requiresPermanent: false },
  { icon: MapPin, label: 'Adresy dostawy', href: '/account/addresses', requiresPermanent: false },
  { icon: Gift, label: 'MESO Club', href: '/account/club', requiresPermanent: true },
  { icon: Settings, label: 'Ustawienia', href: '/account/settings', requiresPermanent: true },
]

export default function AccountPage() {
  const { isLoading, isPermanent, signOut, user } = useAuth()
  const { displayName, avatarInitial, email } = useUserDisplay()
  const { canUseRewards } = useMesoClub()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-meso-dark-800/50 rounded-xl p-5 border border-white/5">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold',
            isPermanent ? 'bg-meso-red-500 text-white' : 'bg-white/10 text-white/60'
          )}>
            {avatarInitial}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{displayName}</h2>
            {email ? (
              <p className="text-sm text-white/50">{email}</p>
            ) : (
              <p className="text-sm text-meso-gold-400">Konto gościa</p>
            )}
          </div>
          {isPermanent && (
            <Link href="/account/profile">
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Loyalty Points for permanent users */}
        {isPermanent && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link href="/account/club" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-meso-gold-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-meso-gold-400" />
                </div>
                <div>
                  <p className="text-sm text-white/60">MESO Club</p>
                  <p className="text-lg font-bold text-meso-gold-400">0 punktów</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </Link>
          </div>
        )}
      </div>

      {/* Anonymous Banner */}
      {!isPermanent && <AnonymousBanner variant="default" />}

      {/* Menu Items */}
      <div className="bg-meso-dark-800/50 rounded-xl border border-white/5 divide-y divide-white/5">
        {MENU_ITEMS.map((item) => {
          const isDisabled = item.requiresPermanent && !isPermanent
          const Icon = item.icon

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-4 p-4 opacity-50 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/40" />
                </div>
                <span className="flex-1 text-white/40">{item.label}</span>
                <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">
                  Wymaga konta
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-meso-red-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-meso-red-500" />
              </div>
              <span className="flex-1 text-white">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </Link>
          )
        })}
      </div>

      {/* Sign Out / Login buttons */}
      <div className="space-y-3">
        {isPermanent ? (
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="w-full h-12 text-meso-red-500 hover:text-meso-red-400 hover:bg-meso-red-500/10 border border-meso-red-500/20"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Wyloguj się
          </Button>
        ) : (
          <div className="flex gap-3">
            <Link href="/account/upgrade" className="flex-1">
              <Button className="w-full h-12 bg-meso-gold-500 hover:bg-meso-gold-600 text-black font-semibold">
                Załóż konto
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button
                variant="outline"
                className="w-full h-12 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              >
                Zaloguj się
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Version info */}
      <p className="text-center text-white/20 text-xs">
        MESO App v1.0.0 • Faza 9 (Profil i MESO Club)
      </p>
    </div>
  )
}
