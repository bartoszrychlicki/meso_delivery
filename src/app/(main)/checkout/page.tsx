'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Store, User, Check, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useCheckout } from '@/hooks/useCheckout'
import { formatPriceExact } from '@/lib/formatters'

// Components
import { DeliveryForm } from '@/components/checkout/DeliveryForm'
import { ContactForm } from '@/components/checkout/ContactForm'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { TermsAcceptance } from '@/components/checkout/TermsAcceptance'
import { TipSelector } from '@/components/cart/TipSelector'
import { EmptyState } from '@/components/common/EmptyState'

// Types
import type { ContactFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, getSubtotal, getDeliveryFee, getDiscount, tip, setDeliveryType } = useCartStore()
    const { user, isLoading: authLoading, isPermanent } = useAuth()
    const { submitOrder, isLoading: isSubmitting } = useCheckout()

    // Form States
    const [deliveryData, setDeliveryData] = useState<DeliveryFormData>({
        type: 'pickup',
        time: 'asap'
    })

    const [contactData, setContactData] = useState<ContactFormData | null>(null)
    const [addressSubmitted, setAddressSubmitted] = useState(false)

    // Location hours & pickup config
    const [locationHours, setLocationHours] = useState<{
        open_time: string
        close_time: string
    } | null>(null)

    const [pickupBuffers, setPickupBuffers] = useState({
        after_open: 30,
        before_close: 30,
    })

    const [pickupEstimate, setPickupEstimate] = useState('~20')

    // Pickup time
    const [pickupTime, setPickupTime] = useState<'asap' | string>('asap')

    const timeSlots = useMemo(() => {
        if (!locationHours) return []

        const now = new Date()

        // Parse open/close times (format from Supabase TIME column: "HH:MM:SS" or "HH:MM")
        const [openH, openM] = locationHours.open_time.split(':').map(Number)
        const [closeH, closeM] = locationHours.close_time.split(':').map(Number)

        // Earliest pickup = open + buffer_after_open
        const earliest = new Date(now)
        earliest.setHours(openH, openM, 0, 0)
        earliest.setMinutes(earliest.getMinutes() + pickupBuffers.after_open)

        // Latest pickup = close - buffer_before_close
        const latest = new Date(now)
        latest.setHours(closeH, closeM, 0, 0)
        latest.setMinutes(latest.getMinutes() - pickupBuffers.before_close)

        // Start from max(earliest, now + 30 min), rounded up to next 15-min slot
        const minTime = new Date(Math.max(earliest.getTime(), now.getTime() + 30 * 60 * 1000))
        minTime.setMinutes(Math.ceil(minTime.getMinutes() / 15) * 15, 0, 0)

        const slots: string[] = []
        let cursor = new Date(minTime)
        while (cursor <= latest) {
            slots.push(cursor.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }))
            cursor = new Date(cursor.getTime() + 15 * 60 * 1000)
        }
        return slots
    }, [locationHours, pickupBuffers])

    // Terms acceptance state
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [termsError, setTermsError] = useState<string | undefined>(undefined)

    // Phone saved in customer profile
    const [savedPhone, setSavedPhone] = useState<string>('')
    const [savePhoneToProfile, setSavePhoneToProfile] = useState(false)
    const [profileLoaded, setProfileLoaded] = useState(false)

    // Pickup location (fetched from DB)
    const [pickupLocation, setPickupLocation] = useState<{
        name: string
        address: string
        city: string
    } | null>(null)

    // Sync delivery type to cart store on mount and changes
    useEffect(() => {
        setDeliveryType(deliveryData.type)
    }, [deliveryData.type, setDeliveryType])

    // Fetch location hours and pickup config from Supabase
    useEffect(() => {
        const fetchLocationConfig = async () => {
            const supabase = createClient()

            const [locationRes, configRes] = await Promise.all([
                supabase
                    .from('locations')
                    .select('name, address, city, open_time, close_time')
                    .eq('is_default', true)
                    .single(),
                supabase
                    .from('app_config')
                    .select('key, value')
                    .in('key', [
                        'pickup_buffer_after_open',
                        'pickup_buffer_before_close',
                        'pickup_time_min',
                        'pickup_time_max',
                    ]),
            ])

            if (locationRes.data) {
                setLocationHours({
                    open_time: locationRes.data.open_time,
                    close_time: locationRes.data.close_time,
                })
                setPickupLocation({
                    name: locationRes.data.name,
                    address: locationRes.data.address,
                    city: locationRes.data.city,
                })
            }

            if (configRes.data) {
                const configMap: Record<string, string> = {}
                for (const row of configRes.data) {
                    configMap[row.key] = typeof row.value === 'string' ? row.value : String(row.value)
                }

                setPickupBuffers({
                    after_open: configMap.pickup_buffer_after_open
                        ? Number(configMap.pickup_buffer_after_open)
                        : 30,
                    before_close: configMap.pickup_buffer_before_close
                        ? Number(configMap.pickup_buffer_before_close)
                        : 30,
                })

                const min = configMap.pickup_time_min
                const max = configMap.pickup_time_max
                if (min && max) {
                    setPickupEstimate(`~${min}-${max}`)
                }
            }
        }

        fetchLocationConfig()
    }, [])

    // Redirect if not logged in (anonymous users cannot checkout)
    useEffect(() => {
        if (!authLoading && !isPermanent) {
            router.push('/login?redirect=/checkout')
        }
    }, [authLoading, isPermanent, router])

    // Pre-fill contact data from customer profile
    useEffect(() => {
        const loadCustomerData = async () => {
            if (!user || profileLoaded) return

            try {
                const supabase = createClient()

                const { data: customer } = await supabase
                    .from('customers')
                    .select('name, email, phone')
                    .eq('id', user.id)
                    .single()

                if (customer?.phone) {
                    setSavedPhone(customer.phone)
                }

                // Parse name into firstName/lastName
                const fullName = customer?.name || ''
                const spaceIndex = fullName.indexOf(' ')
                const firstName = spaceIndex > -1 ? fullName.slice(0, spaceIndex) : fullName
                const lastName = spaceIndex > -1 ? fullName.slice(spaceIndex + 1) : ''

                setContactData({
                    firstName,
                    lastName,
                    email: customer?.email || user.email || '',
                    phone: customer?.phone || '',
                })
            } catch (error) {
                console.error('Error loading customer data:', error)
            } finally {
                setProfileLoaded(true)
            }
        }

        loadCustomerData()
    }, [user, profileLoaded])

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Show loader while checking auth or redirecting anonymous user
    if (authLoading || !isPermanent) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (items.length === 0) {
        return <EmptyState type="cart" action={{ label: 'Wróć do menu', href: '/' }} />
    }

    const handleContactSubmit = (data: ContactFormData, savePhone: boolean) => {
        setContactData(data)
        setSavePhoneToProfile(savePhone)
        setAddressSubmitted(true)
    }

    const handleFinalSubmit = async () => {
        // Validate terms
        if (!termsAccepted) {
            setTermsError('Musisz zaakceptować Regulamin i Politykę Prywatności')
            toast.error('Musisz zaakceptować Regulamin i Politykę Prywatności')
            return
        }

        // Validate contact - trigger form submit
        if (!addressSubmitted) {
            const form = document.getElementById('address-form') as HTMLFormElement | null
            if (form) {
                form.requestSubmit()
                return
            }
        }

        if (!contactData) {
            toast.error('Uzupełnij dane kontaktowe')
            return
        }

        // Build address data for submitOrder (it expects AddressFormData shape)
        const addressData = {
            ...contactData,
            street: '',
            houseNumber: '',
            postalCode: '',
            city: '',
        }

        // Build delivery data with scheduled time if selected
        const finalDeliveryData: DeliveryFormData = {
            ...deliveryData,
            time: pickupTime === 'asap' ? 'asap' : 'scheduled',
            scheduledTime: pickupTime !== 'asap' ? pickupTime : undefined,
        }

        const paymentData: PaymentFormData = { method: 'blik' }

        await submitOrder(finalDeliveryData, addressData, paymentData, savePhoneToProfile)
    }

    const subtotal = getSubtotal()
    const deliveryFee = getDeliveryFee()
    const discount = getDiscount()
    const total = getTotal()

    return (
        <div className="mx-auto max-w-2xl px-4 py-4 pb-8">
            {/* Back link */}
            <Link
                href="/cart"
                className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Koszyk
            </Link>

            <h1 className="mb-6 font-display text-xl font-bold tracking-wider">PODSUMOWANIE</h1>

            {/* Section 1: Delivery mode toggle */}
            <section className="mb-4">
                <DeliveryForm
                    value={deliveryData}
                    onChange={(val) => {
                        setDeliveryData(val as DeliveryFormData)
                        setAddressSubmitted(false)
                    }}
                />
            </section>

            {/* Section 2: Pickup location */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Store className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-xs font-semibold uppercase tracking-wider">Punkt odbioru</h3>
                </div>
                {pickupLocation ? (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-3 bg-primary/10 border border-primary/40 neon-border">
                        <span className="text-lg">📍</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{pickupLocation.name}</p>
                            <p className="text-xs text-muted-foreground">{pickupLocation.address}, {pickupLocation.city}</p>
                        </div>
                        <Check className="h-4 w-4 text-primary shrink-0" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </section>

            {/* Section 3: Pickup time */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-xs font-semibold uppercase tracking-wider">Czas odbioru</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setPickupTime('asap')}
                    className={`w-full mb-2 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        pickupTime === 'asap'
                            ? 'bg-primary text-primary-foreground neon-glow-sm'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                >
                    <span>Najszybciej jak to możliwe</span>
                    <span className="text-xs opacity-80">{pickupEstimate} min</span>
                </button>
                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                    {timeSlots.map((slot) => (
                        <button
                            key={slot}
                            type="button"
                            onClick={() => setPickupTime(slot)}
                            className={`w-full rounded-lg px-4 py-2.5 text-sm text-left transition-all ${
                                pickupTime === slot
                                    ? 'bg-primary text-primary-foreground neon-glow-sm'
                                    : 'bg-secondary/50 text-foreground hover:bg-secondary'
                            }`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
                {timeSlots.length === 0 && locationHours && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Brak dostępnych terminów na dziś
                    </p>
                )}
            </section>

            {/* Section 4: Contact data */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-xs font-semibold uppercase tracking-wider">Dane kontaktowe</h3>
                </div>
                <ContactForm
                    key={profileLoaded ? 'loaded' : 'init'}
                    defaultValues={contactData || {
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                    }}
                    savedPhone={savedPhone}
                    onSubmit={handleContactSubmit}
                />
            </section>

            {/* Section 5: Payment info */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4">
                <PaymentMethod />
            </section>

            {/* Section 6: Tip */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4">
                <TipSelector />
            </section>

            {/* Section 7: Cost summary */}
            <section className="mb-4 rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Produkty</span>
                    <span>{formatPriceExact(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                        <span>Dostawa</span>
                        <span>{formatPriceExact(deliveryFee)}</span>
                    </div>
                )}
                {tip > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                        <span>Napiwek</span>
                        <span>{formatPriceExact(tip)}</span>
                    </div>
                )}
                {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                        <span>Rabat</span>
                        <span>-{formatPriceExact(discount)}</span>
                    </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-display text-base font-bold">
                    <span>Razem</span>
                    <span>{formatPriceExact(total)}</span>
                </div>
            </section>

            {/* Section 8: Terms */}
            <section className="mb-4">
                <TermsAcceptance
                    accepted={termsAccepted}
                    onChange={(accepted) => {
                        setTermsAccepted(accepted)
                        if (accepted) setTermsError(undefined)
                    }}
                    error={termsError}
                />
            </section>

            {/* Section 9: Submit button */}
            <motion.button
                data-testid="checkout-submit-button"
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`w-full rounded-xl py-4 font-display text-sm font-semibold tracking-wider transition-all flex items-center justify-center gap-2 ${
                    !isSubmitting
                        ? 'bg-accent text-accent-foreground neon-glow-yellow hover:scale-[1.02]'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                }`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PRZETWARZANIE...
                    </>
                ) : (
                    'POTWIERDŹ ZAMÓWIENIE'
                )}
            </motion.button>
        </div>
    )
}
