'use client'

import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, ChefHat, Package, MapPin, Navigation, Loader2, XCircle, CreditCard, AlertTriangle } from 'lucide-react'
import { useOrderConfirmationStore } from '@/stores/orderConfirmationStore'
import { formatPriceExact } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { OrderConfirmation } from '@/stores/orderConfirmationStore'
import { useCartStore } from '@/stores/cartStore'
import { PAYMENT_TIMEOUT_MS, getPickupStepIndex, isPaymentPending } from '@/lib/order-confirmation-utils'

// Step definitions for pickup orders
const pickupSteps = [
    { key: 'accepted', label: 'Przyjęte', icon: CheckCircle2 },
    { key: 'paid', label: 'Opłacone', icon: CheckCircle2 },
    { key: 'preparing', label: 'W przygotowaniu', icon: ChefHat },
    { key: 'ready', label: 'Gotowe do odbioru', icon: Package },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildConfirmation(order: Record<string, any>): OrderConfirmation {
    const deliveryAddress = order.delivery_address as Record<string, string | undefined>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const location = order.location as Record<string, any>

    return {
        orderId: order.id.toString(),
        orderNumber: order.id.toString().slice(-6).toUpperCase(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        pickupLocation: location ? {
            name: location.name || 'MESO',
            address: location.address || '',
            city: location.city || '',
        } : null,
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        discount: order.promo_discount || 0,
        tip: order.tip || 0,
        total: order.total,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        orderStatus: order.status,
        estimatedTime: order.delivery_type === 'delivery'
            ? `${location?.delivery_time_min ?? 30}-${location?.delivery_time_max ?? 45} min`
            : '15-20 min',
        createdAt: order.created_at,
    }
}

function OrderConfirmationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { confirmation, setConfirmation, clearConfirmation } = useOrderConfirmationStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    // Initial fetch
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                if (!confirmation) router.replace('/')
                return
            }

            try {
                if (!confirmation) setIsLoading(true)

                const supabase = createClient()

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        location:locations(name, address, city, delivery_time_min, delivery_time_max),
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

                setConfirmation(buildConfirmation(order))
            } catch (err) {
                console.error('Error fetching order:', err)
                setError('Nie udało się pobrać szczegółów zamówienia')
                toast.error('Nie udało się pobrać szczegółów zamówienia')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
    }, [orderId, router, setConfirmation])

    // Supabase Realtime — listen for order updates (status, payment_status)
    useEffect(() => {
        if (!orderId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`order-confirmation-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const updated = payload.new as Record<string, string | undefined>
                    console.log('[Realtime] Order updated:', updated.status, updated.payment_status)

                    setConfirmation((prev) => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            orderStatus: updated.status ?? prev.orderStatus,
                            paymentStatus: updated.payment_status ?? prev.paymentStatus,
                        }
                    })

                    // Toast on status changes
                    if (updated.payment_status === 'paid') {
                        toast.success('Płatność potwierdzona!')
                    }
                    if (updated.status === 'preparing') {
                        toast.info('Przygotowujemy Twój posiłek!')
                    }
                    if (updated.status === 'ready') {
                        toast.success('Zamówienie gotowe do odbioru!')
                    }
                    if (updated.payment_status === 'failed') {
                        toast.error('Płatność nie powiodła się')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId, setConfirmation])

    const { clearCart } = useCartStore()
    const [paymentTimedOut, setPaymentTimedOut] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (confirmation?.paymentStatus === 'paid') {
            clearCart()
        }
    }, [confirmation?.paymentStatus, clearCart])

    // Payment timeout — if payment stays pending for 3 minutes, show warning
    useEffect(() => {
        if (!confirmation) return

        if (isPaymentPending(confirmation.paymentStatus)) {
            timeoutRef.current = setTimeout(() => {
                setPaymentTimedOut(true)
            }, PAYMENT_TIMEOUT_MS)
        } else {
            setPaymentTimedOut(false)
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [confirmation?.paymentStatus, confirmation])

    const currentStep = useMemo(() => {
        if (!confirmation) return 0
        return getPickupStepIndex(confirmation.orderStatus, confirmation.paymentStatus)
    }, [confirmation])

    const isPendingPayment = confirmation && isPaymentPending(confirmation.paymentStatus)

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
    const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled' || status === 'error'

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

    const getMapsUrl = (address: string, city: string) => {
        const query = encodeURIComponent(`${address}, ${city}`)
        return `https://www.google.com/maps/dir/?api=1&destination=${query}`
    }

    const getAppleMapsUrl = (address: string, city: string) => {
        const query = encodeURIComponent(`${address}, ${city}`)
        return `https://maps.apple.com/?daddr=${query}`
    }

    const steps = pickupSteps

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 pb-32">
            {/* Title */}
            <h1 className="mb-2 font-display text-xl font-bold tracking-wider text-center">
                ZAMÓWIENIE ZŁOŻONE
            </h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
                Zamówienie #{confirmation.orderNumber}
            </p>

            {/* Progress bar */}
            <div className="relative mb-10 mx-2">
                {/* Background track */}
                <div className="absolute top-5 left-0 right-0 h-1 rounded-full bg-secondary" />
                {/* Active track */}
                <motion.div
                    className="absolute top-5 left-0 h-1 rounded-full bg-primary neon-glow-sm"
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
                {/* Step indicators */}
                <div className="relative flex justify-between">
                    {steps.map((step, i) => (
                        <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                            <motion.div
                                animate={{
                                    scale: i === currentStep ? 1.2 : 1,
                                }}
                                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                                    i <= currentStep
                                        ? 'border-primary bg-primary'
                                        : 'border-border bg-card'
                                }`}
                            >
                                <step.icon className={`h-4 w-4 ${
                                    i <= currentStep ? 'text-primary-foreground' : 'text-muted-foreground'
                                }`} />
                            </motion.div>
                            <span className={`mt-2 text-[10px] font-medium text-center leading-tight ${
                                i <= currentStep ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending payment indicator */}
            {isPendingPayment && !paymentTimedOut && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                            <CreditCard className="h-5 w-5 text-yellow-500" />
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500 animate-ping" />
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500" />
                        </div>
                        <p className="text-sm font-semibold text-yellow-500">Oczekujemy na potwierdzenie platnosci...</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8">
                        Trwa to zazwyczaj do 30 sekund. Nie zamykaj tej strony.
                    </p>
                </motion.div>
            )}

            {/* Payment timeout warning */}
            {isPendingPayment && paymentTimedOut && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/5 p-5"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-sm font-semibold text-orange-500">Platnosc trwa dluzej niz zwykle</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8 mb-3">
                        Jesli Twoja platnosc zostala pobrana, zamowienie zostanie potwierdzone automatycznie.
                        Jesli nie, sprobuj ponownie lub skontaktuj sie z nami.
                    </p>
                    <div className="flex gap-2 ml-8">
                        <a
                            href="mailto:zamowienia@mesofood.pl"
                            className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                            Napisz do nas
                        </a>
                        <span className="text-xs text-muted-foreground">|</span>
                        <Link
                            href="/checkout"
                            className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                            Sprobuj ponownie
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* ETA */}
            <div className="mb-6 rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                    {isPendingPayment ? 'Szacowany czas po oplaceniu' : 'Szacowany czas przygotowania'}
                </p>
                <p className="font-display text-3xl font-bold text-primary neon-text">
                    {confirmation.estimatedTime}
                </p>
            </div>

            {/* Pickup location with map links */}
            {confirmation.pickupLocation && (
                <div className="mb-6 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h3 className="font-display text-xs font-semibold uppercase tracking-wider">Punkt odbioru</h3>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-0.5">{confirmation.pickupLocation.name}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        {confirmation.pickupLocation.address}, {confirmation.pickupLocation.city}
                    </p>

                    <div className="flex items-center gap-2 mb-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Wskazówki dojazdu</span>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={getMapsUrl(confirmation.pickupLocation.address, confirmation.pickupLocation.city)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-all"
                        >
                            Google Maps
                        </a>
                        <a
                            href={getAppleMapsUrl(confirmation.pickupLocation.address, confirmation.pickupLocation.city)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-all"
                        >
                            Apple Maps
                        </a>
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider mb-3">Twoje zamówienie</h3>
                <div className="space-y-3">
                    {confirmation.items.map((item, idx) => {
                        const itemTotal = (item.price + (item.variantPrice || 0) + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity
                        return (
                            <div key={item.id || idx} className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="text-foreground text-sm">
                                        <span className="text-muted-foreground">{item.quantity}x</span>{' '}
                                        {item.name}
                                    </p>
                                    {item.variantName && (
                                        <p className="text-muted-foreground text-xs">{item.variantName}</p>
                                    )}
                                    {item.spiceLevel && (
                                        <p className="text-muted-foreground text-xs">
                                            {'🔥'.repeat(item.spiceLevel)}
                                        </p>
                                    )}
                                    {item.addons && item.addons.length > 0 && (
                                        <p className="text-muted-foreground text-xs">
                                            + {item.addons.map(a => a.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <span className="text-muted-foreground text-sm ml-2">
                                    {formatPriceExact(itemTotal)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Price Summary */}
            <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Produkty</span>
                    <span className="text-foreground">{formatPriceExact(confirmation.subtotal)}</span>
                </div>
                {confirmation.discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-green-400">Rabat</span>
                        <span className="text-green-400">-{formatPriceExact(confirmation.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Dostawa</span>
                    <span className="text-foreground">
                        {confirmation.deliveryFee > 0 ? formatPriceExact(confirmation.deliveryFee) : 'Gratis'}
                    </span>
                </div>
                {confirmation.tip > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Napiwek</span>
                        <span className="text-foreground">{formatPriceExact(confirmation.tip)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span className="text-foreground">Razem</span>
                    <span className="text-accent text-lg">{formatPriceExact(confirmation.total)}</span>
                </div>
            </div>

            {/* Back to Menu */}
            <Link
                href="/"
                onClick={(e) => { e.preventDefault(); handleBackToMenu() }}
                className="block text-center text-sm text-primary hover:underline"
            >
                Zamów więcej
            </Link>
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
