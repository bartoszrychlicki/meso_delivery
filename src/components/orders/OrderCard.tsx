'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatOrderDateShort, type OrderWithItems } from '@/types/order'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderCardProps {
    order: OrderWithItems
    className?: string
}

export function OrderCard({ order, className }: OrderCardProps) {
    const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const itemNames = order.items?.slice(0, 2).map(item => item.product?.name || 'Produkt').join(', ')
    const hasMoreItems = (order.items?.length || 0) > 2

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price) + ' zł'
    }

    return (
        <Link
            href={`/orders/${order.id}`}
            className={cn(
                'block rounded-xl bg-meso-dark-800 p-4 transition-all hover:bg-meso-dark-800/80 hover:ring-1 hover:ring-meso-red-500/30',
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Order number and date */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-white">
                            #{order.id}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {formatOrderDateShort(order.created_at)}
                        </span>
                    </div>

                    {/* Status badge */}
                    <OrderStatusBadge status={order.status} size="sm" className="mb-2" />

                    {/* Items summary */}
                    <p className="text-sm text-zinc-400 truncate">
                        {itemNames}{hasMoreItems && ` +${(order.items?.length || 0) - 2} więcej`}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {itemCount} {itemCount === 1 ? 'produkt' : itemCount < 5 ? 'produkty' : 'produktów'}
                    </p>
                </div>

                {/* Price and arrow */}
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-meso-red-500">
                        {formatPrice(order.total)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
            </div>
        </Link>
    )
}
