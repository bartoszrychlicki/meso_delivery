'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, Gift, Truck, Percent, UtensilsCrossed, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { LoginPrompt } from '@/components/auth'
import { cn } from '@/lib/utils'
import { useCustomerLoyalty } from '@/hooks/useCustomerLoyalty'
import { useLoyaltyRewards } from '@/hooks/useLoyaltyRewards'
import { useAppConfig } from '@/hooks/useAppConfig'
import type { LoyaltyTier } from '@/types/customer'

interface LoyaltyHistoryEntry {
  id: string
  label: string
  points: number
  type: string
  created_at: string
  order_id?: number
  is_pending_confirmation?: boolean
  pending_message?: string
}

const REWARD_ICONS: Record<string, typeof Gift> = {
  free_delivery: Truck,
  discount: Percent,
  free_product: UtensilsCrossed,
}

const DEFAULT_TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 1500,
}

const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Brązowy',
  silver: 'Srebrny',
  gold: 'Złoty',
}

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold']

export default function LoyaltyPage() {
  const { isPermanent, isLoading: authLoading } = useAuth()
  const { points, tier, lifetimePoints, isLoading: loyaltyLoading } = useCustomerLoyalty()
  const { rewards, isLoading: rewardsLoading } = useLoyaltyRewards()
  const { getValue, isLoading: configLoading } = useAppConfig()
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards')
  const [history, setHistory] = useState<LoyaltyHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const loadHistory = useCallback(async (page = 0) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/loyalty/history?page=${page}`)
      const data = await res.json()
      setHistory(prev => page === 0 ? data.history : [...prev, ...data.history])
      setHasMore(data.hasMore)
      setHistoryPage(page)
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') loadHistory(0)
  }, [activeTab, loadHistory])

  const isLoading = authLoading || loyaltyLoading || configLoading

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

  const tierThresholds = getValue<Record<LoyaltyTier, number>>('loyalty_tier_thresholds', DEFAULT_TIER_THRESHOLDS)

  const currentTier = TIER_ORDER.includes(tier) ? tier : 'bronze'
  const currentTierIdx = TIER_ORDER.indexOf(currentTier)
  const nextTier = currentTierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIdx + 1] : null
  const currentTierFloor = tierThresholds[currentTier] ?? 0
  const nextTierThreshold = nextTier ? (tierThresholds[nextTier] ?? currentTierFloor) : null
  const pointsToNextTier = nextTierThreshold != null ? Math.max(0, nextTierThreshold - lifetimePoints) : 0
  const tierProgress = nextTierThreshold != null
    ? Math.min(
      ((Math.max(lifetimePoints, currentTierFloor) - currentTierFloor) / Math.max(1, nextTierThreshold - currentTierFloor)) * 100,
      100
    )
    : 100

  const nextReward = rewards.find((r) => r.points_cost > points) ?? null
  const topReward = rewards.length > 0 ? rewards[rewards.length - 1] : null
  const rewardProgressBase = nextReward?.points_cost ?? topReward?.points_cost ?? 1
  const rewardProgress = Math.min((points / Math.max(rewardProgressBase, 1)) * 100, 100)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
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

          {/* Loyalty level */}
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-2.5 py-1 font-medium text-white">
                  Poziom: {TIER_LABELS[currentTier]}
                </span>
                <span>Łącznie zebrane: {lifetimePoints} pkt</span>
              </div>
              <span>
                {nextTier
                  ? `${pointsToNextTier} pkt do poziomu ${TIER_LABELS[nextTier]}`
                  : 'Maksymalny poziom osiągnięty'}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress}%` }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                className="h-full rounded-full bg-white/80"
              />
            </div>
          </div>

          {/* Progress bar */}
          {topReward && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                {nextReward ? (
                  <>
                    <span>Następna nagroda: {nextReward.name}</span>
                    <span>{Math.max(0, nextReward.points_cost - points)} pkt</span>
                  </>
                ) : (
                  <>
                    <span>Masz wystarczająco punktów na wszystkie dostępne nagrody</span>
                    <span>{points} pkt</span>
                  </>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rewardProgress}%` }}
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
          {historyLoading && history.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 && !historyLoading ? (
            <div className="py-12 text-center text-white/40 text-sm">
              Brak historii punktów
            </div>
          ) : (
            <div className="space-y-0">
              {history.map((entry) => {
                const isPendingConfirmation = entry.is_pending_confirmation || entry.type === 'pending_confirmation'

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between py-3 border-b',
                      isPendingConfirmation ? 'border-white/10 bg-white/[0.02]' : 'border-white/5'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm font-medium', isPendingConfirmation && 'text-white/70')}>
                          {entry.label}
                        </p>
                        {isPendingConfirmation && (
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/55">
                            Tymczasowe
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {new Date(entry.created_at).toLocaleDateString('pl-PL')}
                      </p>
                      {isPendingConfirmation && (
                        <p className="mt-1 text-xs text-white/50">
                          {entry.pending_message || 'Punkty w trakcie potwierdzania. Po odbiorze zamówienia naliczymy je automatycznie.'}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isPendingConfirmation
                          ? 'text-white/50'
                          : entry.points > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                      )}
                    >
                      {entry.points > 0 ? '+' : ''}{entry.points} pkt
                    </span>
                  </div>
                )
              })}
              {hasMore && (
                <button
                  onClick={() => loadHistory(historyPage + 1)}
                  className="w-full py-3 text-sm text-white/50 hover:text-white"
                >
                  {historyLoading ? 'Ładowanie...' : 'Załaduj więcej'}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
