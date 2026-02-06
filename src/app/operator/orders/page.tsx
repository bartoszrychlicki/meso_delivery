'use client'

import { Loader2, ChefHat, Package, AlertCircle, Bell, BellOff, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOperatorOrders } from '@/hooks/useOperatorOrders'
import { OrderCard } from '@/components/operator/OrderCard'
import { useState, useEffect } from 'react'

export default function OperatorOrdersPage() {
    const {
        newOrders,
        preparingOrders,
        readyOrders,
        isLoading,
        error
    } = useOperatorOrders()

    const [soundEnabled, setSoundEnabled] = useState(true)

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-meso-red-500 mx-auto mb-4" />
                    <p className="text-white/60">Ładowanie zamówień...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-white mb-2">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Odśwież stronę
                    </Button>
                </div>
            </div>
        )
    }

    const totalOrders = newOrders.length + preparingOrders.length + readyOrders.length

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <ChefHat className="w-5 h-5" />
                        <span className="text-lg font-semibold">
                            {totalOrders} {totalOrders === 1 ? 'zamówienie' : totalOrders < 5 ? 'zamówienia' : 'zamówień'}
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={soundEnabled ? 'text-white' : 'text-white/40'}
                >
                    {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </Button>
            </div>

            {totalOrders === 0 ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="text-center">
                        <Utensils className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-xl text-white/60 mb-2">Brak zamówień</p>
                        <p className="text-white/40">Nowe zamówienia pojawią się automatycznie</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* New Orders Column */}
                    <OrderColumn
                        title="NOWE ZAMÓWIENIA"
                        icon={<AlertCircle className="w-5 h-5" />}
                        count={newOrders.length}
                        color="text-orange-500"
                        bgColor="bg-orange-500/10"
                        borderColor="border-orange-500/50"
                    >
                        {newOrders.map(order => (
                            <OrderCard key={order.id} order={order} variant="new" />
                        ))}
                    </OrderColumn>

                    {/* Preparing Column */}
                    <OrderColumn
                        title="W PRZYGOTOWANIU"
                        icon={<ChefHat className="w-5 h-5" />}
                        count={preparingOrders.length}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                        borderColor="border-blue-500/50"
                    >
                        {preparingOrders.map(order => (
                            <OrderCard key={order.id} order={order} variant="preparing" />
                        ))}
                    </OrderColumn>

                    {/* Ready Column */}
                    <OrderColumn
                        title="GOTOWE"
                        icon={<Package className="w-5 h-5" />}
                        count={readyOrders.length}
                        color="text-green-500"
                        bgColor="bg-green-500/10"
                        borderColor="border-green-500/50"
                    >
                        {readyOrders.map(order => (
                            <OrderCard key={order.id} order={order} variant="ready" />
                        ))}
                    </OrderColumn>
                </div>
            )}
        </div>
    )
}

interface OrderColumnProps {
    title: string
    icon: React.ReactNode
    count: number
    color: string
    bgColor: string
    borderColor: string
    children: React.ReactNode
}

function OrderColumn({ title, icon, count, color, bgColor, borderColor, children }: OrderColumnProps) {
    return (
        <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-4`}>
            <div className={`flex items-center gap-2 mb-4 ${color}`}>
                {icon}
                <h2 className="font-bold">{title}</h2>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-sm font-bold ${bgColor} ${color}`}>
                    {count}
                </span>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
}
