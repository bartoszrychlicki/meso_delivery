'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Clock, ChevronRight, Loader2, PlayCircle, CheckCircle,
    Truck, Phone, MapPin, Flame, Plus, UtensilsCrossed
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OperatorOrder, getOrderAge, useOperatorOrders } from '@/hooks/useOperatorOrders'
import { cn } from '@/lib/utils'

interface OrderCardProps {
    order: OperatorOrder
    variant: 'new' | 'preparing' | 'ready'
}

export function OrderCard({ order, variant }: OrderCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const { startPreparing, markAsReady, awaitingCourier } = useOperatorOrders()

    const age = getOrderAge(order.created_at)

    const handleAction = async () => {
        setIsUpdating(true)

        if (variant === 'new') {
            await startPreparing(order.id)
        } else if (variant === 'preparing') {
            await markAsReady(order.id)
        } else if (variant === 'ready') {
            await awaitingCourier(order.id)
        }

        setIsUpdating(false)
    }

    return (
        <div className={cn(
            'bg-meso-dark-900/80 rounded-xl p-4 border transition-all',
            age.isUrgent && variant === 'new' && 'border-red-500 animate-pulse',
            !age.isUrgent && 'border-white/10'
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">#{order.id}</span>
                    <span className={cn(
                        'text-sm px-2 py-0.5 rounded',
                        order.delivery_type === 'delivery'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                    )}>
                        {order.delivery_type === 'delivery' ? 'Dostawa' : 'Odbiór'}
                    </span>
                </div>

                <div className={cn(
                    'flex items-center gap-1 text-sm',
                    age.isUrgent ? 'text-red-400' : 'text-white/50'
                )}>
                    <Clock className="w-4 h-4" />
                    <span>{age.label}</span>
                </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-meso-red-500 w-5">{item.quantity}x</span>
                        <div className="flex-1">
                            <span className="text-white">{item.product?.name || 'Produkt'}</span>
                            {item.variant_name && (
                                <span className="text-white/50 ml-1">({item.variant_name})</span>
                            )}

                            {/* Spice level */}
                            {item.spice_level && item.spice_level > 1 && (
                                <div className="flex items-center gap-1 text-orange-400 mt-0.5">
                                    <Flame className="w-3 h-3" />
                                    <span className="text-xs">
                                        {item.spice_level === 2 ? 'Ostre' : 'Bardzo ostre'}
                                    </span>
                                </div>
                            )}

                            {/* Addons */}
                            {item.addons && item.addons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.addons.map((addon, i) => (
                                        <span key={i} className="flex items-center gap-0.5 text-xs text-green-400">
                                            <Plus className="w-2 h-2" />
                                            {addon.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            {item.notes && (
                                <p className="text-xs text-yellow-400 mt-1 italic">
                                    📝 {item.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Order notes */}
            {order.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-3 text-sm text-yellow-300">
                    📋 {order.notes}
                </div>
            )}

            {/* Customer info (for delivery) */}
            {order.delivery_type === 'delivery' && order.delivery_address && (
                <div className="bg-white/5 rounded-lg p-2 mb-3 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                            {order.delivery_address.street} {order.delivery_address.building_number}
                            {order.delivery_address.apartment_number && `/${order.delivery_address.apartment_number}`}
                        </span>
                    </div>
                    {order.customer?.phone && (
                        <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4" />
                            <span>{order.customer.phone}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Button */}
            <div className="flex gap-2">
                {variant === 'new' && (
                    <Button
                        onClick={handleAction}
                        disabled={isUpdating}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    >
                        {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                ROZPOCZNIJ
                            </>
                        )}
                    </Button>
                )}

                {variant === 'preparing' && (
                    <Button
                        onClick={handleAction}
                        disabled={isUpdating}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                        {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                GOTOWE
                            </>
                        )}
                    </Button>
                )}

                {variant === 'ready' && order.delivery_type === 'delivery' && (
                    <Button
                        onClick={handleAction}
                        disabled={isUpdating}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold"
                    >
                        {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Truck className="w-4 h-4 mr-2" />
                                KURIER
                            </>
                        )}
                    </Button>
                )}

                {variant === 'ready' && order.delivery_type === 'pickup' && (
                    <div className="flex-1 bg-green-500/20 text-green-400 font-bold text-center py-2 rounded-lg">
                        Czeka na odbiór
                    </div>
                )}

                <Link href={`/operator/orders/${order.id}`}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
