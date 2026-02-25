'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useOrderConfirmationStore } from '@/stores/orderConfirmationStore'
import type { AddressFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

export function useCheckout() {
    const router = useRouter()
    const supabase = createClient()
    const { user } = useAuth()
    const { items, getTotal, getSubtotal, getDeliveryFee, getDiscount, tip, promoDiscount, clearCart } = useCartStore()
    const { setConfirmation } = useOrderConfirmationStore()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submitOrder = async (
        deliveryData: DeliveryFormData,
        addressData: AddressFormData,
        paymentData: PaymentFormData,
        savePhoneToProfile?: boolean
    ) => {
        // Prevent double submission
        if (isLoading) return

        try {
            setIsLoading(true)
            setError(null)

            if (!user) {
                throw new Error('Musisz być zalogowany, aby złożyć zamówienie')
            }

            if (items.length === 0) {
                throw new Error('Twój koszyk jest pusty')
            }

            // 1. Get active location (MVP: just get the first one)
            const { data: locations, error: locationError } = await supabase
                .from('locations')
                .select('id')
                .eq('is_active', true)
                .limit(1)
                .single()

            if (locationError || !locations) {
                throw new Error('Nie znaleziono aktywnej restauracji')
            }

            const total = getTotal()
            const subtotal = getSubtotal()

            // 2. Create Order
            // Build scheduled_time as a proper TIMESTAMPTZ if provided
            let scheduledTimestamp: string | null = null
            if (deliveryData.time === 'scheduled' && deliveryData.scheduledTime) {
                const today = new Date()
                const [hours, minutes] = deliveryData.scheduledTime.split(':').map(Number)
                today.setHours(hours, minutes, 0, 0)
                scheduledTimestamp = today.toISOString()
            }

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: user.id,
                    location_id: locations.id,
                    status: 'pending_payment',
                    delivery_type: deliveryData.type,
                    delivery_address: addressData, // JSONB (includes phone)
                    scheduled_time: scheduledTimestamp,
                    payment_method: paymentData.method,
                    payment_status: 'pending',
                    subtotal,
                    delivery_fee: getDeliveryFee(),
                    tip,
                    promo_discount: getDiscount(),
                    total,
                    loyalty_points_earned: Math.floor(total), // 1 pkt = 1 PLN
                    notes: addressData.notes
                })
                .select()
                .single()

            if (orderError) {
                console.error('Order creation error:', orderError)
                throw new Error('Błąd podczas tworzenia zamówienia')
            }

            // 2b. Save phone to customer profile if requested
            if (savePhoneToProfile && addressData.phone) {
                await supabase
                    .from('customers')
                    .update({ phone: addressData.phone })
                    .eq('id', user.id)
            }

            // 3. Create Order Items
            const orderItems = items.map(item => {
                const basePrice = item.price + (item.variantPrice || 0)
                const addonsPrice = item.addons.reduce((sum, addon) => sum + addon.price, 0)
                const unitPrice = basePrice + addonsPrice
                const totalPrice = unitPrice * item.quantity

                return {
                    order_id: order.id,
                    product_id: item.productId,
                    quantity: item.quantity,
                    unit_price: unitPrice, // Storing final unit price including modifiers
                    spice_level: item.spiceLevel,
                    variant_id: item.variantId,
                    variant_name: item.variantName,
                    addons: item.addons, // JSONB
                    total_price: totalPrice,
                }
            })

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) {
                console.error('Order items error:', itemsError)
                // Optionally revert order creation here, but for MVP we skip
                throw new Error('Błąd podczas dodawania produktów do zamówienia')
            }

            // 4. Register Payment with P24
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30_000)
            const response = await fetch('/api/payments/p24/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id }),
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            let data
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                data = await response.json()
            } else {
                // If not JSON (e.g. 404 HTML), throw specific error or generic one
                if (response.status === 404) {
                    throw new Error('Usługa płatności jest niedostępna (404). Spróbuj ponownie później.')
                }
                throw new Error(`Błąd serwera płatności: ${response.status}`)
            }

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas rejestracji płatności')
            }

            if (data.url) {
                // Clear cart before redirecting to P24 — if payment fails,
                // user can retry from order-confirmation page
                clearCart()
                // Redirect to P24
                window.location.href = data.url
            } else {
                throw new Error('Nie otrzymano linku do płatności')
            }

        } catch (err) {
            const isAbort = err instanceof DOMException && err.name === 'AbortError'
            const message = isAbort
                ? 'Serwer płatności nie odpowiada. Spróbuj ponownie za chwilę.'
                : err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd'
            setError(message)
            toast.error(message)
            // If we failed after setting isLoading to true, we must unset it to allow retry
            // BUT for the "duplicate order" issue, validation/logic errors should allow retry.
            // Network errors/404 should allow retry? Yes.
            setIsLoading(false)
        }
        // Note: We removed 'finally { setIsLoading(false) }' because if we redirect,
        // we want the button to stay loading until unmount.
        // But if we catch an error, we MUST set it back to false (done in catch).
    }

    return {
        submitOrder,
        isLoading,
        error,
    }
}
