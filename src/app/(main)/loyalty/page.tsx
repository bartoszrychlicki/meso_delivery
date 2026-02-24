'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Gift, Truck, Percent, UtensilsCrossed, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { LoginPrompt } from '@/components/auth'
import { cn } from '@/lib/utils'
import { useCustomerLoyalty } from '@/hooks/useCustomerLoyalty'
import { useLoyaltyRewards } from '@/hooks/useLoyaltyRewards'
import { useLoyaltyHistory } from '@/hooks/useLoyaltyHistory'

const REWARD_ICONS: Record<string, typeof Gift> = {
  free_delivery: Truck,
  discount: Percent,
  free_product: UtensilsCrossed,
}

export default function LoyaltyPage() {
  const { isPermanent, isLoading: authLoading } = useAuth()
  const { points, isLoading: loyaltyLoading } = useCustomerLoyalty()
  const { rewards, isLoading: rewardsLoading } = useLoyaltyRewards()
  const { history, isLoading: historyLoading } = useLoyaltyHistory()
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards')

  const isLoading = authLoading || loyaltyLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPermanent) {
    return (
      <LoginPrompt
        icon="🏆"
        title="MESO POINTS"
        description="Zaloguj się, aby zbierać punkty i odbierać nagrody za każde zamówienie."
      />
    )
  }

  const nextReward = rewards.find((r) => r.points_cost > points) ?? rewards[rewards.length - 1]
  const progress = nextReward ? Math.min((points / nextReward.points_cost) * 100, 100) : 100

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
              <p className="font-display text-3xl font-bold text-white">{points}</p>
            </div>
            <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
              punktów
            </span>
          </div>

          {/* Progress bar */}
          {nextReward && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Następna nagroda: {nextReward.name}</span>
                <span>{Math.max(0, nextReward.points_cost - points)} pkt</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            </div>
          )}
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
          {rewardsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rewards.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Brak dostępnych nagród</p>
          ) : (
            rewards.map((reward, i) => {
              const canRedeem = points >= reward.points_cost
              const Icon = REWARD_ICONS[reward.reward_type] || Gift
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
                      {reward.points_cost} pkt
                    </p>
                    {canRedeem && (
                      <button className="mt-1 text-xs font-medium text-accent hover:underline">
                        Odbierz
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Brak historii punktów</p>
          ) : (
            history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  entry.points > 0 ? 'text-green-400' : 'text-primary'
                )}>
                  {entry.points > 0 ? '+' : ''}{entry.points}
                </span>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}
