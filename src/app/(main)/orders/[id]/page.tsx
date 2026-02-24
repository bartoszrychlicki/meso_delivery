'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Clock, CreditCard, Truck, Store, Radio } from 'lucide-react'
import { useOrderDetails } from '@/hooks/useOrderDetails'
import { OrderTimeline, OrderStatusBadge, OrderItemsList } from '@/components/orders'
import { ORDER_STATUS_MESSAGES, formatOrderDate } from '@/types/order'
import { formatPrice } from '@/lib/formatters'
import { Button } from '@/components/ui/button'

const ACTIVE_STATUSES = new Set(['pending_payment', 'confirmed', 'preparing', 'ready', 'awaiting_courier', 'in_delivery'])

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const { order, loading, error } = useOrderDetails(orderId)



    const paymentMethodLabels: Record<string, string> = {
        blik: 'BLIK',
        card: 'Karta płatnicza',
        cash: 'Gotówka przy odbiorze',
        apple_pay: 'Apple Pay',
        google_pay: 'Google Pay',
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-zinc-400">Ładowanie zamówienia...</p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">{error || 'Nie znaleziono zamówienia'}</p>
                    <Button
                        onClick={() => router.push('/orders')}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        Wróć do listy zamówień
                    </Button>
                </div>
            </div>
        )
    }

    const statusMessage = ORDER_STATUS_MESSAGES[order.status]

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">Zamówienie #{order.id}</h1>
                        <p className="text-xs text-zinc-400">{formatOrderDate(order.created_at)}</p>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Status section */}
                <section className="rounded-xl bg-card p-6 text-center">
                    <div className="text-4xl mb-3">{statusMessage.emoji}</div>
                    <h2 className="text-xl font-bold text-white mb-1">{statusMessage.title}</h2>
                    <p className="text-zinc-400 text-sm">{statusMessage.subtitle}</p>
                    <div className="mt-4">
                        <OrderStatusBadge status={order.status} size="lg" />
                    </div>
                    {ACTIVE_STATUSES.has(order.status) && (
                        <Link
                            href={`/order-confirmation?orderId=${order.id}`}
                            className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Radio className="w-4 h-4" />
                            Sledz na zywo
                        </Link>
                    )}
                </section>

                {/* Timeline */}
                <section className="rounded-xl bg-card p-4">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Status zamówienia</h3>
                    <OrderTimeline status={order.status} />
                </section>

                {/* Delivery info */}
                <section className="rounded-xl bg-card p-4">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">
                        {order.delivery_type === 'delivery' ? 'Dostawa' : 'Odbiór osobisty'}
                    </h3>

                    <div className="space-y-3">
                        {order.delivery_type === 'delivery' && order.delivery_address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">
                                        {order.delivery_address.street} {order.delivery_address.building_number}
                                        {order.delivery_address.apartment_number && `/${order.delivery_address.apartment_number}`}
                                    </p>
                                    <p className="text-zinc-400 text-sm">
                                        {order.delivery_address.postal_code} {order.delivery_address.city}
                                    </p>
                                </div>
                            </div>
                        )}

                        {order.delivery_type === 'pickup' && order.location && (
                            <div className="flex items-start gap-3">
                                <Store className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">{order.location.name}</p>
                                    <p className="text-zinc-400 text-sm">{order.location.address}</p>
                                </div>
                            </div>
                        )}

                        {order.scheduled_time && (
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-primary" />
                                <p className="text-white">
                                    Zaplanowano na: {formatOrderDate(order.scheduled_time)}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Order items */}
                <section>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Twoje zamówienie</h3>
                    <OrderItemsList items={order.items} />
                </section>

                {/* Payment summary */}
                <section className="rounded-xl bg-card p-4">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Podsumowanie</h3>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Produkty</span>
                            <span className="text-white">{formatPrice(order.subtotal)}</span>
                        </div>

                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Dostawa</span>
                                <span className="text-white">{formatPrice(order.delivery_fee)}</span>
                            </div>
                        )}

                        {order.promo_discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Rabat ({order.promo_code})</span>
                                <span className="text-green-500">-{formatPrice(order.promo_discount)}</span>
                            </div>
                        )}

                        {order.tip > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Napiwek</span>
                                <span className="text-white">{formatPrice(order.tip)}</span>
                            </div>
                        )}

                        <div className="border-t border-zinc-700 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="font-bold text-white">Razem</span>
                                <span className="font-bold text-xl text-primary">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-700">
                        <CreditCard className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">
                            {paymentMethodLabels[order.payment_method] || order.payment_method}
                        </span>
                    </div>
                </section>

                {/* Restaurant contact */}
                {order.location?.phone && (
                    <section className="rounded-xl bg-card p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3">Kontakt z restauracją</h3>
                        <a
                            href={`tel:${order.location.phone}`}
                            className="flex items-center gap-3 text-primary hover:text-primary transition-colors"
                        >
                            <Phone className="w-5 h-5" />
                            <span className="font-medium">{order.location.phone}</span>
                        </a>
                    </section>
                )}
            </main>
        </div>
    )
}
