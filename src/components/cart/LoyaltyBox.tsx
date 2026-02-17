'use client'

import Link from 'next/link'
import { Crown, Gift, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function LoyaltyBox() {
  const { isPermanent } = useAuth()

  if (!isPermanent) {
    return (
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-accent" />
          <span className="font-display text-xs font-bold tracking-wider text-accent">
            MESO CLUB
          </span>
        </div>
        <p className="text-sm text-foreground font-medium mb-1">
          Zbieraj punkty, odbieraj nagrody
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Darmowe dania, zniżki i ekskluzywne oferty czekają na Ciebie.
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground transition-all neon-glow-sm hover:scale-[1.02]"
        >
          Zarejestruj się i odbieraj darmowe jedzenie
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  // TODO: Fetch real points from Supabase
  const points = 340
  const nextReward = 500
  const progress = Math.min((points / nextReward) * 100, 100)

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          <span className="font-display text-xs font-bold tracking-wider text-accent">
            MESO CLUB
          </span>
        </div>
        <Link href="/loyalty" className="text-xs text-primary hover:underline">
          Zobacz więcej
        </Link>
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-lg font-display font-bold text-foreground">
          {points}{' '}
          <span className="text-xs text-muted-foreground font-sans font-normal">
            pkt
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          do nagrody: {nextReward - points} pkt
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 neon-glow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5">
        <Gift className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            Darmowe Gyoza 🥟
          </p>
          <p className="text-[10px] text-muted-foreground">
            Następna nagroda za {nextReward - points} pkt
          </p>
        </div>
      </div>
    </div>
  )
}
