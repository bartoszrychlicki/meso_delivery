'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Clock, ChevronDown, ChevronUp, Loader2, PlayCircle, CheckCircle,
    Truck, Phone, MapPin, Flame, Plus, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OperatorOrder, getOrderAge } from '@/hooks/useOperatorOrders'
import { cn } from '@/lib/utils'

interface OrderCardProps {
    order: OperatorOrder
    variant: 'new' | 'preparing' | 'ready' | 'in_delivery' | 'delivered'
    onStartPreparing?: (id: number) => Promise<boolean>
    onMarkAsReady?: (id: number) => Promise<boolean>
    onMarkAsInDelivery?: (id: number) => Promise<boolean>
    onMarkAsDelivered?: (id: number) => Promise<boolean>
}

export function OrderCard({
    order,
    variant,
    onStartPreparing,
    onMarkAsReady,
    onMarkAsInDelivery,
    onMarkAsDelivered,
}: OrderCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [updatingAction, setUpdatingAction] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    const age = getOrderAge(order.created_at)

    const handleAction = async (action: string) => {
        setIsUpdating(true)
        setUpdatingAction(action)

        try {
            if (action === 'start' && onStartPreparing) {
                await onStartPreparing(order.id)
            } else if (action === 'ready' && onMarkAsReady) {
                await onMarkAsReady(order.id)
            } else if (action === 'courier' && onMarkAsInDelivery) {
                await onMarkAsInDelivery(order.id)
            } else if (action === 'delivered' && onMarkAsDelivered) {
                await onMarkAsDelivered(order.id)
            }
        } catch (error) {
            console.error(error)
        }

        setIsUpdating(false)
        setUpdatingAction(null)
    }

    const firstItem = order.items[0]
    const remainingItems = order.items.slice(1)
    const hasMoreItems = remainingItems.length > 0

    return (
        <div className={cn(
            'bg-meso-dark-900/80 rounded-xl p-3 border transition-all',
            age.isUrgent && (variant === 'new' || variant === 'preparing') && 'border-red-500 animate-pulse',
            !age.isUrgent && 'border-white/10',
            variant === 'delivered' && 'opacity-75'
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">#{order.id}</span>
                    <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        order.delivery_type === 'delivery'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                    )}>
                        {order.delivery_type === 'delivery' ? 'Dostawa' : 'Odbiór'}
                    </span>
                </div>

                <div className={cn(
                    'flex items-center gap-1 text-xs',
                    age.isUrgent && (variant === 'new' || variant === 'preparing') ? 'text-red-400' : 'text-white/50'
                )}>
                    <Clock className="w-3 h-3" />
                    <span>{age.label}</span>
                </div>
            </div>

            {/* First item (always visible) */}
            {firstItem && (
                <ItemRow item={firstItem} />
            )}

            {/* Expandable: remaining items + notes + address */}
            {(hasMoreItems || order.notes || (order.delivery_type === 'delivery' && order.delivery_address)) && (
                <>
                    {isExpanded && (
                        <div className="space-y-1 mt-1">
                            {remainingItems.map((item) => (
                                <ItemRow key={item.id} item={item} />
                            ))}

                            {/* Order notes */}
                            {order.notes && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-xs text-yellow-300">
                                    📋 {order.notes}
                                </div>
                            )}

                            {/* Customer info (for delivery) */}
                            {order.delivery_type === 'delivery' && order.delivery_address && (
                                <div className="bg-white/5 rounded-lg p-2 text-xs text-white/60">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span>
                                            {order.delivery_address.street} {order.delivery_address.building_number}
                                            {order.delivery_address.apartment_number && `/${order.delivery_address.apartment_number}`}
                                        </span>
                                    </div>
                                    {order.customer?.phone && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Phone className="w-3 h-3 shrink-0" />
                                            <span>{order.customer.phone}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 mt-1.5 mb-2 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Zwiń
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                {hasMoreItems
                                    ? `+${remainingItems.length} więcej pozycji`
                                    : 'Pokaż szczegóły'}
                            </>
                        )}
                    </button>
                </>
            )}

            {/* Spacer if no expandable content */}
            {!hasMoreItems && !order.notes && !(order.delivery_type === 'delivery' && order.delivery_address) && (
                <div className="mb-2" />
            )}

            {/* Details link */}
            <Link
                href={`/operator/orders/${order.id}`}
                className="text-xs text-white/40 hover:text-white/70 transition-colors mb-2 inline-block"
            >
                Szczegóły →
            </Link>

            {/* Action Buttons */}
            <div className="space-y-2">
                {variant === 'new' && (
                        <Button
                            onClick={() => handleAction('start')}
                            disabled={isUpdating}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-sm"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <PlayCircle className="w-4 h-4 mr-1.5" />
                                    ROZPOCZNIJ
                                </>
                            )}
                        </Button>
                    )}

                    {variant === 'preparing' && (
                        <Button
                            onClick={() => handleAction('ready')}
                            disabled={isUpdating}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-9 text-sm"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                    GOTOWE
                                </>
                            )}
                        </Button>
                    )}

                    {variant === 'ready' && (
                        <>
                            <Button
                                onClick={() => handleAction('courier')}
                                disabled={isUpdating}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold h-9 text-sm"
                            >
                                {isUpdating && updatingAction === 'courier' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Truck className="w-4 h-4 mr-1.5" />
                                        WYDANO KURIEROWI
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleAction('delivered')}
                                disabled={isUpdating}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-9 text-sm"
                            >
                                {isUpdating && updatingAction === 'delivered' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <User className="w-4 h-4 mr-1.5" />
                                        WYDANO KLIENTOWI
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {variant === 'in_delivery' && (
                        <Button
                            onClick={() => handleAction('delivered')}
                            disabled={isUpdating}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-9 text-sm"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                    DOSTARCZONO
                                </>
                            )}
                        </Button>
                    )}

                    {variant === 'delivered' && (
                        <div className="w-full bg-white/5 text-white/40 font-bold text-center py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>ZAKOŃCZONE</span>
                        </div>
                    )}
            </div>
        </div>
    )
}

function ItemRow({ item }: { item: OperatorOrder['items'][0] }) {
    return (
        <div className="flex items-start gap-1.5 text-sm">
            <span className="font-bold text-meso-red-500 w-5 shrink-0">{item.quantity}x</span>
            <div className="flex-1 min-w-0">
                <span className="text-white">{item.product?.name || 'Produkt'}</span>
                {item.variant_name && (
                    <span className="text-white/50 ml-1">({item.variant_name})</span>
                )}

                {/* Spice level */}
                {item.spice_level && item.spice_level > 1 && (
                    <span className="inline-flex items-center gap-0.5 text-orange-400 ml-1">
                        <Flame className="w-3 h-3" />
                        <span className="text-xs">
                            {item.spice_level === 2 ? 'Ostre' : 'Bardzo ostre'}
                        </span>
                    </span>
                )}

                {/* Addons */}
                {item.addons && item.addons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
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
                    <p className="text-xs text-yellow-400 mt-0.5 italic">
                        📝 {item.notes}
                    </p>
                )}
            </div>
        </div>
    )
}
