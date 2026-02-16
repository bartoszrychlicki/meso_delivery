'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, MapPin, Store, ArrowLeft, Loader2, XCircle } from 'lucide-react'
import { useOrderConfirmationStore } from '@/stores/orderConfirmationStore'
import { formatPriceExact } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { OrderConfirmation } from '@/stores/orderConfirmationStore'
import { useCartStore } from '@/stores/cartStore'

function OrderConfirmationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { confirmation, setConfirmation, clearConfirmation } = useOrderConfirmationStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    useEffect(() => {
        let pollInterval: NodeJS.Timeout

        const fetchOrder = async () => {
            // We fetch if we have orderId. 
            // If we already have confirmation but it's pending, we ALSO fetch to update status.
            if (!orderId) {
                if (!confirmation) router.replace('/')
                return
            }

            try {
                // Determine if we need to show loading (only if no data yet)
                if (!confirmation) setIsLoading(true)

                const supabase = createClient()

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        items:order_items(
                            *,
                            product:products(*)
                        )
                    `)
                    .eq('id', orderId)
                    .single()

                if (orderError || !order) {
                    throw new Error('Nie znaleziono zamówienia')
                }

                const deliveryAddress = order.delivery_address as any

                const confirmationData: OrderConfirmation = {
                    orderId: order.id.toString(),
                    orderNumber: order.id.toString().slice(-6).toUpperCase(),
                    items: order.items.map((item: any) => ({
                        id: item.id,
                        productId: item.product_id,
                        name: item.product?.name || item.custom_name || 'Produkt',
                        price: item.unit_price,
                        variantPrice: 0,
                        image: item.product?.image_url,
                        quantity: item.quantity,
                        spiceLevel: item.spice_level,
                        variantId: item.variant_id,
                        variantName: item.variant_name,
                        addons: item.addons || [],
                        notes: item.notes
                    })),
                    deliveryType: order.delivery_type,
                    deliveryAddress: order.delivery_type === 'delivery' ? {
                        street: deliveryAddress?.street,
                        houseNumber: deliveryAddress?.houseNumber,
                        apartmentNumber: deliveryAddress?.apartmentNumber,
                        city: deliveryAddress?.city,
                        firstName: deliveryAddress?.firstName,
                        lastName: deliveryAddress?.lastName,
                    } : null,
                    subtotal: order.subtotal,
                    deliveryFee: order.delivery_fee,
                    discount: order.promo_discount || 0,
                    tip: order.tip || 0,
                    total: order.total,
                    paymentMethod: order.payment_method,
                    paymentStatus: order.payment_status, // Map from DB
                    estimatedTime: order.delivery_type === 'delivery' ? '30-45 min' : '15-20 min',
                    createdAt: order.created_at,
                }

                setConfirmation(confirmationData)

                // If pending, poll again
                if (order.payment_status === 'pending' && order.payment_method === 'p24') {
                    // Poll every 3 seconds
                    // We handle interval outside to avoid overlaps?
                    // actually simple recursion or interval in useEffect is fine.
                }

            } catch (err) {
                console.error('Error fetching order:', err)
                setError('Nie udało się pobrać szczegółów zamówienia')
                toast.error('Nie udało się pobrać szczegółów zamówienia')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()

        // Set up polling if needed
        pollInterval = setInterval(() => {
            // access current confirmation state? Ref might be better or just simpler logic:
            // logic: if orderId exists, fetch. The fetch function handles updating store.
            // optimization: only fetch if specifically needed.
            // For simplicity: just fetch every 5s if we are on this page with orderId.
            // The user stays here waiting for payment.
            fetchOrder()
        }, 5000)

        return () => clearInterval(pollInterval)
    }, [orderId, router, setConfirmation])

    const { clearCart } = useCartStore()

    // Separate effect for clearing cart on success status
    useEffect(() => {
        // If payment is confirmed (paid), clear cart
        if (confirmation?.paymentStatus === 'paid') {
            clearCart()
        }
    }, [confirmation?.paymentStatus, clearCart])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="ml-3 text-white/60">Ładowanie zamówienia...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Wystąpił błąd</h1>
                <p className="text-white/60 mb-6">{error}</p>
                <Link
                    href="/"
                    className="bg-primary text-white px-6 py-3 rounded-xl font-medium"
                >
                    Wróć do menu
                </Link>
            </div>
        )
    }

    if (!confirmation) {
        return null
    }

    const { paymentStatus } = confirmation
    const isPending = paymentStatus === 'pending'
    const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled' || status === 'error' // Callback might set status=error query param

    if (isFailed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <XCircle className="w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Płatność nie powiodła się</h1>
                <p className="text-white/60 mb-8 max-w-md">
                    Twoja płatność została anulowana lub wystąpił błąd.
                    Spróbuj ponownie złożyć zamówienie.
                </p>
                <div className="flex gap-4">
                    <Link
                        href="/"
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        Wróć do menu
                    </Link>
                    <Link
                        href="/checkout"
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        Spróbuj ponownie
                    </Link>
                </div>
            </div>
        )
    }

    const handleBackToMenu = () => {
        clearConfirmation()
        router.push('/')
    }

    return (
        <div className="flex flex-col min-h-screen pb-24">
            {/* Success Header */}
            <div className="bg-gradient-to-b from-green-500/20 to-transparent px-4 pt-8 pb-6 text-center">
                {isPending ? (
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : (
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                )}

                <h1 className="text-2xl font-bold text-white mb-1">
                    {isPending ? 'Oczekiwanie na płatność...' : 'Zamówienie przyjęte!'}
                </h1>
                <p className="text-white/60">
                    {isPending ? 'Trwa weryfikacja płatności' : 'Numer zamówienia'}
                </p>

                <p className="text-accent font-mono text-lg font-bold mt-1">
                    #{confirmation.orderNumber}
                </p>
            </div>

            <div className="px-4 space-y-4">
                {/* Estimated Time */}
                <div className="bg-card rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Szacowany czas</p>
                            <p className="text-white font-bold text-lg">{confirmation.estimatedTime}</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-card rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {confirmation.deliveryType === 'delivery' ? (
                                <MapPin className="w-5 h-5 text-primary" />
                            ) : (
                                <Store className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">
                                {confirmation.deliveryType === 'delivery' ? 'Adres dostawy' : 'Odbiór osobisty'}
                            </p>
                            {confirmation.deliveryType === 'delivery' && confirmation.deliveryAddress ? (
                                <p className="text-white font-medium">
                                    {confirmation.deliveryAddress.street} {confirmation.deliveryAddress.houseNumber}
                                    {confirmation.deliveryAddress.apartmentNumber ? `/${confirmation.deliveryAddress.apartmentNumber}` : ''}
                                    , {confirmation.deliveryAddress.city}
                                </p>
                            ) : (
                                <p className="text-white font-medium">MESO Food, Gdańsk</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-card rounded-xl p-4 border border-white/5">
                    <h3 className="text-white font-medium mb-3">Twoje zamówienie</h3>
                    <div className="space-y-3">
                        {confirmation.items.map((item, idx) => {
                            // Calculate item total properly
                            // If coming from DB, price might be total unit price?
                            // Let's rely on stored price in item
                            const itemTotal = (item.price + (item.variantPrice || 0) + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity
                            return (
                                <div key={item.id || idx} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-white text-sm">
                                            <span className="text-white/50">{item.quantity}x</span>{' '}
                                            {item.name}
                                        </p>
                                        {item.variantName && (
                                            <p className="text-white/40 text-xs">{item.variantName}</p>
                                        )}
                                        {item.spiceLevel && (
                                            <p className="text-white/40 text-xs">
                                                {'🔥'.repeat(item.spiceLevel)}
                                            </p>
                                        )}
                                        {item.addons && item.addons.length > 0 && (
                                            <p className="text-white/40 text-xs">
                                                + {item.addons.map(a => a.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-white/60 text-sm ml-2">
                                        {formatPriceExact(itemTotal)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-card rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-white/60">Produkty</span>
                        <span className="text-white">{formatPriceExact(confirmation.subtotal)}</span>
                    </div>
                    {confirmation.discount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-green-400">Rabat</span>
                            <span className="text-green-400">-{formatPriceExact(confirmation.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-white/60">Dostawa</span>
                        <span className="text-white">
                            {confirmation.deliveryFee > 0 ? formatPriceExact(confirmation.deliveryFee) : 'Gratis'}
                        </span>
                    </div>
                    {confirmation.tip > 0 && (
                        <div className="flex justify-between">
                            <span className="text-white/60">Napiwek</span>
                            <span className="text-white">{formatPriceExact(confirmation.tip)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-border">
                        <span className="text-foreground">Razem</span>
                        <span className="text-accent text-lg">{formatPriceExact(confirmation.total)}</span>
                    </div>
                </div>
            </div>

            {/* Back to Menu Button */}
            <div className="fixed bottom-[85px] left-0 right-0 z-50 mx-4 lg:relative lg:bottom-auto lg:mx-0 lg:mt-6">
                <div className="bg-background border border-border p-4 rounded-2xl shadow-xl lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent">
                    <button
                        onClick={handleBackToMenu}
                        className="w-full rounded-xl py-4 font-display text-sm font-semibold tracking-wider bg-accent text-accent-foreground neon-glow-yellow hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        WRÓĆ DO MENU
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
    )
}
