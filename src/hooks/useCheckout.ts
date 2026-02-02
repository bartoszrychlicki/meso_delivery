'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import type { AddressFormData, DeliveryFormData, PaymentFormData } from '@/lib/validators/checkout'

export function useCheckout() {
    const router = useRouter()
    const supabase = createClient()
    const { user } = useAuth()
    const { items, getTotal, getSubtotal, getDeliveryFee, tip, promoDiscount, clearCart } = useCartStore()

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
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: user.id,
                    location_id: locations.id,
                    status: 'pending_payment',
                    delivery_type: deliveryData.type,
                    delivery_address: addressData, // JSONB
                    scheduled_time: deliveryData.time === 'scheduled' ? deliveryData.scheduledTime : null,
                    payment_method: paymentData.method,
                    payment_status: 'pending', // Mock payment will update this later
                    subtotal,
                    delivery_fee: getDeliveryFee(),
                    tip,
                    promo_discount: promoDiscount,
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

            // 4. Mock Payment Success
            // In real app, we would redirect to P24 or Stripe here.
            // For MVP, we update status to 'paid' and 'confirmed'

            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'confirmed',
                    payment_status: 'paid',
                    paid_at: new Date().toISOString(),
                    confirmed_at: new Date().toISOString(),
                })
                .eq('id', order.id)

            if (updateError) {
                console.error('Payment update error:', updateError)
                throw new Error('Błąd podczas aktualizacji statusu płatności')
            }

            // 5. Success
            toast.success('Zamówienie zostało złożone pomyślnie!')
            clearCart()

            // Redirect to order details (or thank you page)
            // Since we don't have order details page yet in implementation plan, redirecting to menu or account
            router.push('/menu') // Temporary

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
