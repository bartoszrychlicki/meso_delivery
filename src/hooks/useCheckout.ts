'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useOrderConfirmationStore } from '@/stores/orderConfirmationStore'
import type { AddressFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

export function useCheckout() {
    const router = useRouter()
    const { user } = useAuth()
    const { items, getTotal, getSubtotal, getDeliveryFee, getDiscount, tip, promoDiscount, clearCart } = useCartStore()
    const { setConfirmation } = useOrderConfirmationStore()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submitOrder = async (
        deliveryData: DeliveryFormData,
        addressData: AddressFormData,
        paymentData: PaymentFormData
    ) => {
        try {
            setIsLoading(true)
            setError(null)

            if (!user) {
                throw new Error('Musisz być zalogowany, aby złożyć zamówienie')
            }

            if (items.length === 0) {
                throw new Error('Twój koszyk jest pusty')
            }

            const total = getTotal()
            const subtotal = getSubtotal()
            const deliveryFee = getDeliveryFee()
            const discount = getDiscount()

            // Build delivery address for DB
            const deliveryAddress = deliveryData.type === 'delivery' ? {
                street: addressData.street,
                houseNumber: addressData.houseNumber,
                apartmentNumber: addressData.apartmentNumber,
                city: addressData.city,
                postalCode: addressData.postalCode,
                firstName: addressData.firstName,
                lastName: addressData.lastName,
            } : null

            // Call our payment registration API
            const response = await fetch('/api/payments/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryType: deliveryData.type,
                    deliveryAddress,
                    scheduledTime: deliveryData.time === 'scheduled' ? deliveryData.scheduledTime : null,
                    paymentMethod: paymentData.method,
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        variantPrice: item.variantPrice,
                        variantId: item.variantId,
                        variantName: item.variantName,
                        spiceLevel: item.spiceLevel,
                        addons: item.addons,
                    })),
                    subtotal,
                    deliveryFee,
                    tip,
                    promoDiscount,
                    total,
                    notes: addressData.notes,
                    contactEmail: addressData.email,
                    contactName: `${addressData.firstName} ${addressData.lastName}`,
                    contactPhone: addressData.phone,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Błąd podczas składania zamówienia')
            }

            const result = await response.json()

            // For online payments - redirect to P24
            if (result.redirectUrl) {
                // Save cart data before clearing (for order confirmation page)
                const confirmationItems = [...items]
                setConfirmation({
                    orderId: String(result.orderId),
                    orderNumber: String(result.orderId),
                    items: confirmationItems,
                    deliveryType: deliveryData.type,
                    deliveryAddress: deliveryData.type === 'delivery' ? {
                        street: addressData.street,
                        houseNumber: addressData.houseNumber,
                        apartmentNumber: addressData.apartmentNumber,
                        city: addressData.city,
                        firstName: addressData.firstName,
                        lastName: addressData.lastName,
                    } : null,
                    subtotal,
                    deliveryFee,
                    discount,
                    tip,
                    total,
                    paymentMethod: paymentData.method,
                    estimatedTime: deliveryData.type === 'delivery' ? '30-45 min' : '15-20 min',
                    createdAt: new Date().toISOString(),
                })

                clearCart()

                // Redirect to Przelewy24 payment page
                window.location.href = result.redirectUrl
                return
            }

            // For cash payments - go directly to confirmation
            const confirmationItems = [...items]
            setConfirmation({
                orderId: String(result.orderId),
                orderNumber: String(result.orderId),
                items: confirmationItems,
                deliveryType: deliveryData.type,
                deliveryAddress: deliveryData.type === 'delivery' ? {
                    street: addressData.street,
                    houseNumber: addressData.houseNumber,
                    apartmentNumber: addressData.apartmentNumber,
                    city: addressData.city,
                    firstName: addressData.firstName,
                    lastName: addressData.lastName,
                } : null,
                subtotal,
                deliveryFee,
                discount,
                tip,
                total,
                paymentMethod: paymentData.method,
                estimatedTime: deliveryData.type === 'delivery' ? '30-45 min' : '15-20 min',
                createdAt: new Date().toISOString(),
            })

            clearCart()
            toast.success('Zamówienie zostało złożone pomyślnie!')
            router.push('/order-confirmation')

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd'
            setError(message)
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return {
        submitOrder,
        isLoading,
        error,
    }
}
