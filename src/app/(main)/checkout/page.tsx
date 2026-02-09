'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useCheckout } from '@/hooks/useCheckout'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'

// Components
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import { DeliveryForm } from '@/components/checkout/DeliveryForm'
import { AddressForm } from '@/components/checkout/AddressForm'
import { ContactForm } from '@/components/checkout/ContactForm'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { TermsAcceptance } from '@/components/checkout/TermsAcceptance'
import { EmptyState } from '@/components/common/EmptyState'

// Types
import type { AddressFormData, ContactFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

const STEPS = [
    { id: 'delivery', label: 'Dostawa' },
    { id: 'address', label: 'Adres' },
    { id: 'payment', label: 'Płatność' },
    { id: 'summary', label: 'Gotowe' },
]

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, canCheckout } = useCartStore()
    const { user, isLoading: authLoading } = useAuth()
    const { submitOrder, isLoading: isSubmitting } = useCheckout()

    const [currentStep, setCurrentStep] = useState(0)

    // Form States
    const [deliveryData, setDeliveryData] = useState<DeliveryFormData>({
        type: 'delivery',
        time: 'asap'
    })

    const [addressData, setAddressData] = useState<AddressFormData | null>(null)
    const [contactData, setContactData] = useState<ContactFormData | null>(null)

    const [paymentData, setPaymentData] = useState<PaymentFormData>({
        method: 'blik'
    })

    // Terms acceptance state
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [termsError, setTermsError] = useState<string | undefined>(undefined)

    // Redirect if cart is empty or user not logged in
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

                // 1. Get customer profile
                const { data: customer } = await supabase
                    .from('customers')
                    .select('name, email, phone')
                    .eq('id', user.id)
                    .single()

                // 2. Get default address
                const { data: address } = await supabase
                    .from('customer_addresses')
                    .select('*')
                    .eq('customer_id', user.id)
                    .eq('is_default', true)
                    .single()

                if (customer || address) {
                    const nameParts = (customer?.name || '').split(' ')
                    const firstName = nameParts[0] || ''
                    const lastName = nameParts.slice(1).join(' ') || ''

                    // Dane kontaktowe (dla pickup)
                    setContactData({
                        firstName: firstName,
                        lastName: lastName,
                        email: customer?.email || user.email || '',
                        phone: customer?.phone || '',
                    })

                    // Pełne dane adresowe (dla delivery)
                    setAddressData({
                        firstName: firstName,
                        lastName: lastName,
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
    }, [user, addressData])

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
            </div>
        )
    }

    if (items.length === 0) {
        return <EmptyState type="cart" action={{ label: 'Wróć do menu', href: '/menu' }} />
    }

    const handleNextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        } else {
            router.back()
        }
    }

    const handleAddressSubmit = (data: AddressFormData) => {
        setAddressData(data)
        handleNextStep()
    }

    const handleContactSubmit = (data: ContactFormData) => {
        setContactData(data)
        handleNextStep()
    }

    const handleFinalSubmit = async () => {
        // Validate terms acceptance
        if (!termsAccepted) {
            setTermsError('Musisz zaakceptować Regulamin i Politykę Prywatności')
            toast.error('Musisz zaakceptować Regulamin i Politykę Prywatności')
            return
        }

        // Dla pickup wystarczą dane kontaktowe, dla delivery pełny adres
        const customerData = deliveryData.type === 'pickup' ? contactData : addressData
        if (!customerData) return

        await submitOrder(deliveryData, customerData as AddressFormData, paymentData)
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <DeliveryForm
                        value={deliveryData}
                        onChange={(val) => setDeliveryData(val as DeliveryFormData)}
                    />
                )
            case 1:
                // Dla pickup pokazujemy tylko ContactForm, dla delivery pełny AddressForm
                if (deliveryData.type === 'pickup') {
                    return (
                        <ContactForm
                            defaultValues={contactData || {
                                firstName: addressData?.firstName || '',
                                lastName: addressData?.lastName || '',
                                email: addressData?.email || '',
                                phone: addressData?.phone || '',
                            }}
                            onSubmit={handleContactSubmit}
                        />
                    )
                }
                return (
                    <AddressForm
                        defaultValues={addressData || undefined}
                        onSubmit={handleAddressSubmit}
                    />
                )
            case 2:
                return (
                    <div className="space-y-6">
                        <PaymentMethod
                            value={paymentData.method}
                            onChange={(val) => setPaymentData({ ...paymentData, method: val })}
                        />

                        <div className="pt-4 border-t border-white/10">
                            <h3 className="text-white font-medium mb-2">Podsumowanie</h3>
                            <div className="bg-meso-dark-800 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/60">Dostawa:</span>
                                    <span className="text-white">{deliveryData.type === 'delivery' ? 'Kurier' : 'Odbiór osobisty'}</span>
                                </div>
                                {deliveryData.type === 'delivery' && addressData && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Adres:</span>
                                        <span className="text-white text-right">
                                            {addressData.street} {addressData.houseNumber}{addressData.apartmentNumber ? `/${addressData.apartmentNumber}` : ''}, {addressData.city}
                                        </span>
                                    </div>
                                )}
                                {deliveryData.type === 'pickup' && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Odbiór:</span>
                                        <span className="text-white text-right">MESO Food, Gdańsk</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-2 border-t border-white/5">
                                    <span className="text-white">Do zapłaty:</span>
                                    <span className="text-meso-red-500 text-lg">
                                        {formatPrice(getTotal())}
                                    </span>
                                </div>
                            </div>
                        </div>


                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-meso-dark-900/80 backdrop-blur-sm border-b border-meso-red-500/20 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrevStep}
                        className="p-2 -ml-2 text-white/80 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="font-bold text-lg text-white tracking-wider">CHECKOUT</div>

                    <div className="w-10">
                        {/* Placeholder for symmetry */}
                    </div>
                </div>

                <div className="mt-4 mb-2">
                    <CheckoutWizard currentStep={currentStep} steps={STEPS} />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-4 py-6 pb-32">
                {renderStepContent()}
            </main>

            {/* Footer Actions */}
            <div className="fixed bottom-[85px] left-0 right-0 z-20 mx-4">
                <div className="bg-meso-dark-900 border border-white/10 p-4 rounded-2xl shadow-xl">
                    {currentStep === 1 ? (
                        <button
                            type="submit"
                            form="address-form"
                            className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
                        >
                            Dalej
                        </button>
                    ) : currentStep === 2 ? (
                        <div className="space-y-4">
                            {/* Terms Acceptance moved to footer */}
                            <TermsAcceptance
                                accepted={termsAccepted}
                                onChange={(accepted) => {
                                    setTermsAccepted(accepted)
                                    if (accepted) setTermsError(undefined)
                                }}
                                error={termsError}
                            />

                            <button
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-meso-gold-500 hover:bg-meso-gold-400 text-black font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Przetwarzanie...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Zamawiam i płacę
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleNextStep}
                            className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
                        >
                            Dalej
                        </button>
                    )}

                    {currentStep === 2 && (
                        <div className="text-center mt-3 text-xs text-white/30 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" />
                            Połączenie szyfrowane SSL
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
