'use client'

import Link from 'next/link'
import { User, MapPin, CreditCard, Heart, Settings, LogOut, ChevronRight, Loader2, Star, Package, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth, useUserDisplay } from '@/hooks/useAuth'
import { AnonymousBanner } from '@/components/auth'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { icon: User, label: 'Dane osobowe', href: '/account/personal', requiresPermanent: true },
  { icon: MapPin, label: 'Adresy', href: '/account/addresses', requiresPermanent: false },
  { icon: CreditCard, label: 'Płatności', href: '/account/payments', requiresPermanent: true },
  { icon: Heart, label: 'Ulubione', href: '/account/favorites', requiresPermanent: true },
  { icon: Package, label: 'Moje zamówienia', href: '/orders', requiresPermanent: false },
  { icon: Settings, label: 'Ustawienia', href: '/account/settings', requiresPermanent: true },
]

export default function AccountPage() {
  const { isLoading, isPermanent, signOut } = useAuth()
  const { displayName, avatarInitial, email } = useUserDisplay()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isPermanent) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-20 text-center min-h-[60vh]">
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-card/50 border border-primary/30 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          👤
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wider uppercase mb-3">
          TWÓJ PROFIL
        </h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Zaloguj się, aby zarządzać profilem, adresami i metodami płatności.
        </p>
        <Link href="/login">
          <button className="flex items-center gap-2 bg-accent text-accent-foreground font-display font-bold uppercase tracking-wider px-8 py-3 rounded-xl">
            <ArrowRight className="h-5 w-5" />
            ZALOGUJ SIĘ
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User Avatar + Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold',
          isPermanent ? 'bg-primary text-primary-foreground neon-glow-sm' : 'bg-secondary text-muted-foreground'
        )}>
          {avatarInitial}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold">{displayName}</h2>
          {email ? (
            <p className="text-sm text-muted-foreground">{email}</p>
          ) : (
            <p className="text-sm text-accent">Konto gościa</p>
          )}
        </div>
      </motion.div>

      {/* Anonymous Banner */}
      {!isPermanent && <AnonymousBanner variant="default" />}

      {/* MESO Club Mini Card */}
      {isPermanent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/loyalty"
            className="flex items-center gap-4 rounded-xl border border-accent/30 bg-gradient-to-r from-primary/20 via-card to-accent/20 p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Star className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">MESO Club</p>
              <p className="text-xs text-muted-foreground">Zbieraj punkty, odbieraj nagrody</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </motion.div>
      )}

      {/* Profile Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
      >
        {MENU_ITEMS.map((item) => {
          const isDisabled = item.requiresPermanent && !isPermanent
          const Icon = item.icon

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-4 px-4 py-3.5 opacity-40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                  Wymaga konta
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )
        })}
      </motion.div>

      {/* Sign Out / Login */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {isPermanent ? (
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border border-border"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Wyloguj się
          </Button>
        ) : (
          <div className="flex gap-3">
            <Link href="/register" className="flex-1">
              <Button className="w-full h-12 bg-accent text-accent-foreground font-semibold neon-glow-yellow">
                Załóż konto
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button
                variant="outline"
                className="w-full h-12"
              >
                Zaloguj się
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground/40">
        MESO App v1.0.0
      </p>
    </div>
  )
}
