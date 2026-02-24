'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Gift, Truck, Percent, UtensilsCrossed, ArrowLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const REWARDS = [
  { id: 1, name: 'Darmowa dostawa', points: 150, icon: Truck, description: 'Przy następnym zamówieniu' },
  { id: 2, name: 'Gyoza gratis', points: 300, icon: UtensilsCrossed, description: '6 sztuk do zamówienia' },
  { id: 3, name: '20% zniżka', points: 500, icon: Percent, description: 'Na całe zamówienie' },
  { id: 4, name: 'Darmowy ramen', points: 800, icon: Gift, description: 'Dowolny ramen z menu' },
]

const HISTORY = [
  { id: 1, label: 'Zamówienie #1042', points: 45, date: '12.02.2026', type: 'earned' as const },
  { id: 2, label: 'Darmowa dostawa', points: -150, date: '10.02.2026', type: 'spent' as const },
  { id: 3, label: 'Zamówienie #1038', points: 62, date: '08.02.2026', type: 'earned' as const },
  { id: 4, label: 'Bonus rejestracyjny', points: 50, date: '01.02.2026', type: 'earned' as const },
  { id: 5, label: 'Zamówienie #1035', points: 38, date: '28.01.2026', type: 'earned' as const },
  { id: 6, label: 'Polecenie znajomego', points: 100, date: '25.01.2026', type: 'earned' as const },
]

const MOCK_POINTS = 420
const NEXT_REWARD = REWARDS.find((r) => r.points > MOCK_POINTS) ?? REWARDS[REWARDS.length - 1]
const PROGRESS = Math.min((MOCK_POINTS / NEXT_REWARD.points) * 100, 100)

export default function LoyaltyPage() {
  const { isPermanent, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards')

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPermanent) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-20 text-center min-h-[60vh]">
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-card/50 border border-primary/30 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          🏆
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wider uppercase mb-3">
          MESO POINTS
        </h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Zaloguj się, aby zbierać punkty i odbierać nagrody za każde zamówienie.
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
      {/* Back button */}
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Profil
      </Link>

      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-primary/60 to-accent/40 p-6 neon-glow"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/70">MESO Club</p>
              <p className="font-display text-3xl font-bold text-white">{MOCK_POINTS}</p>
            </div>
            <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
              punktów
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>Następna nagroda: {NEXT_REWARD.name}</span>
              <span>{NEXT_REWARD.points - MOCK_POINTS} pkt</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${PROGRESS}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-accent"
              />
            </div>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        <button
          onClick={() => setActiveTab('rewards')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
            activeTab === 'rewards'
              ? 'bg-card text-foreground neon-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Nagrody
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'bg-card text-foreground neon-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Historia
        </button>
      </div>

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {REWARDS.map((reward, i) => {
            const canRedeem = MOCK_POINTS >= reward.points
            const Icon = reward.icon
            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'flex items-center gap-4 rounded-xl border p-4 transition-colors',
                  canRedeem
                    ? 'border-accent/30 bg-card hover:bg-card/80'
                    : 'border-border bg-card/50 opacity-60'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  canRedeem ? 'bg-accent/20' : 'bg-secondary'
                )}>
                  <Icon className={cn('h-5 w-5', canRedeem ? 'text-accent' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    canRedeem ? 'text-accent' : 'text-muted-foreground'
                  )}>
                    {reward.points} pkt
                  </p>
                  {canRedeem && (
                    <button className="mt-1 text-xs font-medium text-accent hover:underline">
                      Odbierz
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {HISTORY.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <span className={cn(
                'text-sm font-bold',
                entry.type === 'earned' ? 'text-green-400' : 'text-primary'
              )}>
                {entry.type === 'earned' ? '+' : ''}{entry.points}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
