'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, Clock, Package, DollarSign, ChefHat, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DailyStats {
    totalOrders: number
    completedOrders: number
    avgPrepTime: number
    totalRevenue: number
}

export default function OperatorStatsPage() {
    const [stats, setStats] = useState<DailyStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const supabase = createClient()

            // Get today's date range
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            // Fetch today's orders
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, status, total, created_at, confirmed_at, ready_at')
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .not('status', 'eq', 'cancelled')

            if (error) {
                console.error('Error fetching stats:', error)
                setIsLoading(false)
                return
            }

            // Calculate stats
            const totalOrders = orders?.length || 0
            const completedOrders = orders?.filter((o: any) =>
                ['ready', 'awaiting_courier', 'in_delivery', 'delivered'].includes(o.status)
            ).length || 0

            // Calculate average prep time (confirmed -> ready)
            const ordersWithPrepTime = orders?.filter((o: any) => o.confirmed_at && o.ready_at) || []
            let avgPrepTime = 0
            if (ordersWithPrepTime.length > 0) {
                const totalPrepTime = ordersWithPrepTime.reduce((sum: number, o: any) => {
                    const confirmed = new Date(o.confirmed_at).getTime()
                    const ready = new Date(o.ready_at).getTime()
                    return sum + (ready - confirmed)
                }, 0)
                avgPrepTime = Math.round(totalPrepTime / ordersWithPrepTime.length / 60000) // in minutes
            }

            const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0

            setStats({
                totalOrders,
                completedOrders,
                avgPrepTime,
                totalRevenue,
            })
            setIsLoading(false)
        }

        fetchStats()
        // Refresh every 5 minutes
        const interval = setInterval(fetchStats, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-meso-red-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-meso-red-500" />
                Statystyki dnia
            </h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Package className="w-8 h-8" />}
                    label="Zamówienia dzisiaj"
                    value={stats?.totalOrders || 0}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                />

                <StatCard
                    icon={<ChefHat className="w-8 h-8" />}
                    label="Ukończone"
                    value={stats?.completedOrders || 0}
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                />

                <StatCard
                    icon={<Clock className="w-8 h-8" />}
                    label="Śr. czas przygotowania"
                    value={stats?.avgPrepTime ? `${stats.avgPrepTime} min` : '-'}
                    color="text-orange-500"
                    bgColor="bg-orange-500/10"
                />

                <StatCard
                    icon={<DollarSign className="w-8 h-8" />}
                    label="Przychód"
                    value={`${(stats?.totalRevenue || 0).toFixed(2)} zł`}
                    color="text-meso-gold-500"
                    bgColor="bg-meso-gold-500/10"
                />
            </div>

            {/* Placeholder for more detailed stats */}
            <div className="bg-meso-dark-800/50 rounded-xl p-8 border border-white/5 text-center">
                <UtensilsCrossed className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/60 mb-2">Szczegółowe statystyki</p>
                <p className="text-white/40">Rozszerzone raporty dostępne wkrótce</p>
            </div>
        </div>
    )
}

interface StatCardProps {
    icon: React.ReactNode
    label: string
    value: string | number
    color: string
    bgColor: string
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
    return (
        <div className={`rounded-xl p-6 ${bgColor} border border-white/5`}>
            <div className={`${color} mb-4`}>{icon}</div>
            <p className="text-white/60 text-sm mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    )
}
