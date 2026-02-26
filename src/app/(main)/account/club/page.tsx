'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Gift, Loader2, Check, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoginPrompt } from '@/components/auth'
import { useAuth } from '@/hooks/useAuth'
import { useCustomerLoyalty } from '@/hooks/useCustomerLoyalty'
import { useLoyaltyRewards, type LoyaltyRewardRow } from '@/hooks/useLoyaltyRewards'
import { useAppConfig } from '@/hooks/useAppConfig'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DEFAULT_TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 1500 }

const TIER_LABELS: Record<string, string> = {
    bronze: 'Brązowy',
    silver: 'Srebrny',
    gold: 'Złoty',
}

const TIER_COLORS: Record<string, string> = {
    bronze: 'from-orange-600 to-orange-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-500 to-yellow-700',
}

const TIER_ORDER = ['bronze', 'silver', 'gold']

export default function MesoClubPage() {
    const { user, isLoading: authLoading, isPermanent } = useAuth()

    const {
        points: loyaltyPoints,
        tier: loyaltyTier,
        lifetimePoints,
        isLoading: loyaltyLoading,
        refresh: refreshLoyalty,
    } = useCustomerLoyalty()
    const { rewards, isLoading: rewardsLoading } = useLoyaltyRewards()
    const { getValue, isLoading: configLoading } = useAppConfig()
    const [redeemingReward, setRedeemingReward] = useState<string | null>(null)
    const [confirmReward, setConfirmReward] = useState<LoyaltyRewardRow | null>(null)
    const [activeCoupon, setActiveCoupon] = useState<{ id: string; code: string; expires_at: string } | null>(null)

    const tierThresholds = getValue<Record<string, number>>('loyalty_tier_thresholds', DEFAULT_TIER_THRESHOLDS)

    // Check for existing active coupon on mount
    useEffect(() => {
        if (!isPermanent) return
        fetch('/api/loyalty/active-coupon')
            .then(r => r.json())
            .then(d => setActiveCoupon(d.coupon ?? null))
            .catch(() => {})
    }, [isPermanent])

    const handleActivateCoupon = async (reward: LoyaltyRewardRow) => {
        setRedeemingReward(reward.id)
        try {
            const res = await fetch('/api/loyalty/activate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reward_id: reward.id }),
            })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Nie udało się aktywować kuponu')
                return
            }

            // Add coupon to cart store
            const { useCartStore } = await import('@/stores/cartStore')
            useCartStore.getState().setLoyaltyCoupon(data.coupon)

            toast.success(`Aktywowano kupon: ${reward.name}`, {
                description: 'Kupon został dodany do koszyka. Ważny 24h.',
            })

            // Update active coupon state so buttons become disabled
            setActiveCoupon(data.coupon)

            // Refresh points display
            refreshLoyalty()
            setConfirmReward(null)
        } catch {
            toast.error('Wystąpił błąd')
        } finally {
            setRedeemingReward(null)
        }
    }

    const isLoading = authLoading || loyaltyLoading || rewardsLoading || configLoading

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isPermanent) {
        return (
            <LoginPrompt
                icon={<Star className="w-12 h-12 text-primary" />}
                title="MESO CLUB"
                description="Zaloguj się, aby dołączyć do programu lojalnościowego i zdobywać punkty!"
            />
        )
    }

    const nextTier = loyaltyTier === 'bronze' ? 'silver' : loyaltyTier === 'silver' ? 'gold' : null
    const pointsToNextTier = nextTier ? Math.max(0, (tierThresholds[nextTier] ?? 0) - lifetimePoints) : 0
    const customerTierIdx = TIER_ORDER.indexOf(loyaltyTier || 'bronze')

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
            {/* Back */}
            <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Profil
            </Link>

            <h1 className="font-display text-xl font-bold">MESO Club</h1>

            {/* Membership Card */}
            <div className={cn(
                'relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br',
                TIER_COLORS[loyaltyTier] || TIER_COLORS.bronze
            )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-white" fill="currentColor" />
                        <span className="text-white/80 font-medium">MESO CLUB</span>
                    </div>

                    <p className="text-white text-lg font-semibold mb-1">
                        {user?.email?.split('@')[0] || 'Członek'}
                    </p>

                    <div className="mt-6">
                        <p className="text-white/70 text-sm">Twoje punkty</p>
                        <p className="text-4xl font-bold text-white">{loyaltyPoints.toLocaleString('pl-PL')}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                            {TIER_LABELS[loyaltyTier] || loyaltyTier}
                        </span>
                        {nextTier && pointsToNextTier > 0 && (
                            <span className="text-white/60 text-sm">
                                {pointsToNextTier} pkt do {TIER_LABELS[nextTier]} (łącznie)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Coupon Banner */}
            {activeCoupon && (
                <div className="rounded-xl bg-meso-gold-400/10 border border-meso-gold-400/20 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-meso-gold-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-meso-gold-400">Masz aktywny kupon</p>
                        <p className="text-xs text-white/60 mt-1">
                            Użyj go lub poczekaj aż wygaśnie, zanim aktywujesz kolejny.
                        </p>
                    </div>
                </div>
            )}

            {/* Available Rewards */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Dostępne nagrody
                </h2>

                <div className="space-y-3">
                    {rewards.map((reward) => {
                        const canAfford = loyaltyPoints >= reward.points_cost
                        const isRedeeming = redeemingReward === reward.id
                        const rewardTierIdx = TIER_ORDER.indexOf(reward.min_tier || 'bronze')
                        const tierLocked = customerTierIdx < rewardTierIdx
                        const hasActiveCoupon = !!activeCoupon
                        const canActivate = canAfford && !tierLocked && !hasActiveCoupon

                        return (
                            <div
                                key={reward.id}
                                className={cn(
                                    'bg-card/50 rounded-xl p-4 border border-white/5 flex items-center gap-4',
                                    tierLocked && 'opacity-50'
                                )}
                            >
                                <div className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                                    canActivate ? 'bg-accent/20' : 'bg-white/5'
                                )}>
                                    {tierLocked ? (
                                        <Lock className="w-6 h-6 text-white/30" />
                                    ) : (
                                        <Gift className={cn(
                                            'w-6 h-6',
                                            canActivate ? 'text-accent' : 'text-white/30'
                                        )} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={cn(
                                            'font-medium',
                                            canActivate ? 'text-white' : 'text-white/50'
                                        )}>
                                            {reward.name}
                                        </p>
                                        {tierLocked && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-medium">
                                                Od {TIER_LABELS[reward.min_tier] || reward.min_tier}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/50 truncate">
                                        {reward.description}
                                    </p>
                                </div>

                                <div className="flex-shrink-0">
                                    {tierLocked ? (
                                        <span className="text-sm text-white/30">
                                            {reward.points_cost} pkt
                                        </span>
                                    ) : canActivate ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setConfirmReward(reward)}
                                            disabled={isRedeeming}
                                            className="bg-accent hover:bg-accent/90 text-black font-semibold"
                                        >
                                            {isRedeeming ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>Aktywuj</>
                                            )}
                                        </Button>
                                    ) : hasActiveCoupon ? (
                                        <span className="text-sm text-white/30">
                                            {reward.points_cost} pkt
                                        </span>
                                    ) : (
                                        <span className="text-sm text-white/30">
                                            Brakuje {reward.points_cost - loyaltyPoints} pkt
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* How to earn points */}
            <div className="bg-card/50 rounded-xl p-5 border border-white/5">
                <h3 className="text-white font-semibold mb-4">Jak zdobywać punkty?</h3>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 text-white/70">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span><strong className="text-white">1 zł = 1 punkt</strong> za każde zamówienie</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/70">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span><strong className="text-white">+50 punktów</strong> za rejestrację</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/70">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span><strong className="text-white">+50 punktów</strong> za pierwsze zamówienie</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/70">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span><strong className="text-white">+100 punktów</strong> za polecenie znajomego</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/70">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span><strong className="text-white">x2 punkty</strong> w Twoje urodziny</span>
                    </li>
                </ul>
            </div>

            {/* Confirmation Modal */}
            {confirmReward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-meso-dark-800 p-6 space-y-4">
                        <h3 className="text-lg font-bold">Aktywujesz kupon</h3>
                        <p className="text-sm text-white/70">{confirmReward.name}</p>
                        <p className="text-sm">Koszt: <span className="font-bold text-meso-gold-400">{confirmReward.points_cost} pkt</span></p>
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                            <p className="text-xs text-red-400">Punkty nie podlegają zwrotowi. Kupon ważny 24 godziny.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmReward(null)}
                                className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={() => handleActivateCoupon(confirmReward)}
                                disabled={redeemingReward === confirmReward.id}
                                className="flex-1 rounded-xl bg-meso-red-500 py-3 text-sm font-bold"
                            >
                                {redeemingReward === confirmReward.id ? 'Aktywowanie...' : 'Potwierdzam'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
