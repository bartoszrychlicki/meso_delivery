'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useCheckout } from '@/hooks/useCheckout'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'

// Components
import { DeliveryForm } from '@/components/checkout/DeliveryForm'
import { AddressForm } from '@/components/checkout/AddressForm'
import { ContactForm } from '@/components/checkout/ContactForm'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { TermsAcceptance } from '@/components/checkout/TermsAcceptance'
import { TipSelector } from '@/components/cart/TipSelector'
import { EmptyState } from '@/components/common/EmptyState'

// Types
import type { AddressFormData, ContactFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, getSubtotal, getDeliveryFee, tip, promoDiscount } = useCartStore()
    const { user, isLoading: authLoading } = useAuth()
    const { submitOrder, isLoading: isSubmitting } = useCheckout()

    // Form States
    const [deliveryData, setDeliveryData] = useState<DeliveryFormData>({
        type: 'pickup',
        time: 'asap'
    })

    const [addressData, setAddressData] = useState<AddressFormData | null>(null)
    const [contactData, setContactData] = useState<ContactFormData | null>(null)
    const [addressSubmitted, setAddressSubmitted] = useState(false)

    const [paymentData, setPaymentData] = useState<PaymentFormData>({
        method: 'blik'
    })

    // Terms acceptance state
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [termsError, setTermsError] = useState<string | undefined>(undefined)

    // Phone saved in customer profile
    const [savedPhone, setSavedPhone] = useState<string>('')
    const [savePhoneToProfile, setSavePhoneToProfile] = useState(false)

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/checkout')
        }
    }, [authLoading, user, router])

    // Pre-fill address and contact data from customer profile
    useEffect(() => {
        const loadCustomerData = async () => {
            if (!user || addressData || contactData) return

            try {
                const supabase = createClient()

                const { data: customer } = await supabase
                    .from('customers')
                    .select('name, email, phone')
                    .eq('id', user.id)
                    .single()

                const { data: address } = await supabase
                    .from('customer_addresses')
                    .select('*')
                    .eq('customer_id', user.id)
                    .eq('is_default', true)
                    .single()

                if (customer?.phone) {
                    setSavedPhone(customer.phone)
                }

                if (customer || address) {
                    const nameParts = (customer?.name || '').split(' ')
                    const firstName = nameParts[0] || ''
                    const lastName = nameParts.slice(1).join(' ') || ''

                    setContactData({
                        firstName,
                        lastName,
                        email: customer?.email || user.email || '',
                        phone: customer?.phone || '',
                    })

                    setAddressData({
                        firstName,
                        lastName,
                        email: customer?.email || user.email || '',
                        phone: customer?.phone || '',
                        street: address?.street || '',
                        houseNumber: address?.building_number || '',
                        apartmentNumber: address?.apartment_number || '',
                        postalCode: address?.postal_code || '',
                        city: address?.city || 'Gdańsk',
                        notes: address?.notes || ''
                    })
                }
            } catch (error) {
                console.error('Error loading customer data:', error)
            }
        }

        loadCustomerData()
    }, [user, addressData, contactData])

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (items.length === 0) {
        return <EmptyState type="cart" action={{ label: 'Wróć do menu', href: '/' }} />
    }

    const handleAddressSubmit = (data: AddressFormData, savePhone: boolean) => {
        setAddressData(data)
        setSavePhoneToProfile(savePhone)
        setAddressSubmitted(true)
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

        // Validate address/contact - trigger form submit
        if (!addressSubmitted) {
            const form = document.getElementById('address-form') as HTMLFormElement | null
            if (form) {
                form.requestSubmit()
                return
            }
        }

        const customerData = deliveryData.type === 'pickup' ? contactData : addressData
        if (!customerData) {
            toast.error('Uzupełnij dane kontaktowe')
            return
        }

        await submitOrder(deliveryData, customerData as AddressFormData, paymentData, savePhoneToProfile)
    }

    const total = getTotal()
    const subtotal = getSubtotal()
    const deliveryFee = getDeliveryFee()

    return (
        <div className="mx-auto max-w-2xl px-4 py-4 pb-48">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Wróć
            </button>

            <h1 className="mb-6 font-display text-xl font-bold tracking-wider">
                CHECKOUT
            </h1>

            {/* Section 1: Delivery type */}
            <section className="mb-6">
                <DeliveryForm
                    value={deliveryData}
                    onChange={(val) => {
                        setDeliveryData(val as DeliveryFormData)
                        setAddressSubmitted(false)
                    }}
                />
            </section>

            {/* Section 2: Address / Contact */}
            <section className="mb-6 p-4 bg-card rounded-xl border border-border">
                <h2 className="text-foreground font-semibold mb-4">
                    {deliveryData.type === 'pickup' ? 'Dane kontaktowe' : 'Adres dostawy'}
                </h2>
                {deliveryData.type === 'pickup' ? (
                    <ContactForm
                        defaultValues={contactData || {
                            firstName: addressData?.firstName || '',
                            lastName: addressData?.lastName || '',
                            email: addressData?.email || '',
                            phone: addressData?.phone || '',
                        }}
                        savedPhone={savedPhone}
                        onSubmit={handleContactSubmit}
                    />
                ) : (
                    <AddressForm
                        defaultValues={addressData || undefined}
                        savedPhone={savedPhone}
                        onSubmit={handleAddressSubmit}
                    />
                )}
            </section>

            {/* Section 3: Payment Method */}
            <section className="mb-6 p-4 bg-card rounded-xl border border-border">
                <PaymentMethod
                    value={paymentData.method}
                    onChange={(val) => setPaymentData({ ...paymentData, method: val })}
                />
            </section>

            {/* Section 4: Tip */}
            <section className="mb-6 p-4 bg-card rounded-xl border border-border">
                <TipSelector />
            </section>

            {/* Section 5: Order Summary */}
            <section className="mb-6 p-4 bg-card rounded-xl border border-border">
                <h2 className="text-foreground font-semibold mb-3">Podsumowanie</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Produkty:</span>
                        <span className="text-foreground">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dostawa:</span>
                        <span className="text-foreground">
                            {deliveryFee === 0 ? 'Gratis' : formatPrice(deliveryFee)}
                        </span>
                    </div>
                    {tip > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Napiwek:</span>
                            <span className="text-foreground">{formatPrice(tip)}</span>
                        </div>
                    )}
                    {promoDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                            <span>Rabat:</span>
                            <span>-{formatPrice(promoDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-border">
                        <span className="text-foreground">Razem:</span>
                        <span className="text-accent text-lg">
                            {formatPrice(total)}
                        </span>
                    </div>
                </div>

                {deliveryData.type === 'delivery' && addressData?.street && (
                    <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                        Adres: {addressData.street} {addressData.houseNumber}
                        {addressData.apartmentNumber ? `/${addressData.apartmentNumber}` : ''}, {addressData.city}
                    </div>
                )}
                {deliveryData.type === 'pickup' && (
                    <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                        Odbiór osobisty: MESO Food, Gdańsk
                    </div>
                )}
            </section>

            {/* Section 6: Terms */}
            <section className="mb-6">
                <TermsAcceptance
                    accepted={termsAccepted}
                    onChange={(accepted) => {
                        setTermsAccepted(accepted)
                        if (accepted) setTermsError(undefined)
                    }}
                    error={termsError}
                />
            </section>

            {/* Fixed CTA Button */}
            <div className="fixed bottom-[85px] left-0 right-0 z-50 mx-4 lg:relative lg:bottom-auto lg:mx-0 lg:mt-6">
                <div className="bg-background border border-border p-4 rounded-2xl shadow-xl lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent">
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className={cn(
                            'w-full rounded-xl py-4 font-display text-sm font-semibold tracking-wider transition-all flex items-center justify-center gap-2',
                            'bg-accent text-accent-foreground neon-glow-yellow hover:scale-[1.02]',
                            isSubmitting && 'opacity-70 cursor-not-allowed'
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                PRZETWARZANIE...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                ZAMAWIAM I PŁACĘ &bull; {formatPrice(total)}
                            </>
                        )}
                    </button>
                    <div className="text-center mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        Połączenie szyfrowane SSL
                    </div>
                </div>
            </div>
        </div>
    )
}
