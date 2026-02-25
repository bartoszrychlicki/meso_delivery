'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Gift, Users, Cake, Loader2, Check } from 'lucide-react'
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

export default function MesoClubPage() {
    const { user, isLoading: authLoading, isPermanent } = useAuth()

    const { points: loyaltyPoints, tier: loyaltyTier, isLoading: loyaltyLoading } = useCustomerLoyalty()
    const { rewards, isLoading: rewardsLoading } = useLoyaltyRewards()
    const { getValue, isLoading: configLoading } = useAppConfig()
    const [redeemingReward, setRedeemingReward] = useState<string | null>(null)

    const tierThresholds = getValue<Record<string, number>>('loyalty_tier_thresholds', DEFAULT_TIER_THRESHOLDS)

    const handleRedeemReward = async (reward: LoyaltyRewardRow) => {
        if (loyaltyPoints < reward.points_cost) {
            toast.error('Nie masz wystarczającej liczby punktów')
            return
        }

        setRedeemingReward(reward.id)

        // TODO: Implement actual reward redemption via API
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success(`Dodano nagrodę: ${reward.name}`, {
            description: 'Zostanie zastosowana przy następnym zamówieniu',
        })

        setRedeemingReward(null)
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
    const pointsToNextTier = nextTier ? (tierThresholds[nextTier] ?? 0) - loyaltyPoints : 0

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
                                {pointsToNextTier} pkt do {TIER_LABELS[nextTier]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button className="bg-card/50 rounded-xl p-4 border border-white/5 text-left hover:bg-white/5 transition-colors">
                    <Users className="w-6 h-6 text-accent mb-2" />
                    <p className="text-white font-medium text-sm">Poleć znajomemu</p>
                    <p className="text-white/50 text-xs">+100 punktów</p>
                </button>

                <button className="bg-card/50 rounded-xl p-4 border border-white/5 text-left hover:bg-white/5 transition-colors">
                    <Cake className="w-6 h-6 text-primary mb-2" />
                    <p className="text-white font-medium text-sm">Urodziny</p>
                    <p className="text-white/50 text-xs">x2 punkty cały dzień</p>
                </button>
            </div>

            {/* Available Rewards */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Dostępne nagrody
                </h2>

                <div className="space-y-3">
                    {rewards.map((reward) => {
                        const canRedeem = loyaltyPoints >= reward.points_cost
                        const isRedeeming = redeemingReward === reward.id

                        return (
                            <div
                                key={reward.id}
                                className="bg-card/50 rounded-xl p-4 border border-white/5 flex items-center gap-4"
                            >
                                <div className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                                    canRedeem ? 'bg-accent/20' : 'bg-white/5'
                                )}>
                                    <Gift className={cn(
                                        'w-6 h-6',
                                        canRedeem ? 'text-accent' : 'text-white/30'
                                    )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        'font-medium',
                                        canRedeem ? 'text-white' : 'text-white/50'
                                    )}>
                                        {reward.name}
                                    </p>
                                    <p className="text-sm text-white/50 truncate">
                                        {reward.description}
                                    </p>
                                </div>

                                <div className="flex-shrink-0">
                                    {canRedeem ? (
                                        <Button
                                            size="sm"
                                            onClick={() => handleRedeemReward(reward)}
                                            disabled={isRedeeming}
                                            className="bg-accent hover:bg-accent/90 text-black font-semibold"
                                        >
                                            {isRedeeming ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>{reward.points_cost} pkt</>
                                            )}
                                        </Button>
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
        </div>
    )
}
