'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/types'
import { toast } from 'sonner'

export interface OperatorOrder extends Order {
    items: (OrderItem & {
        product: {
            id: string
            name: string
            image_url: string | null
        }
        variant_name?: string | null
    })[]
    customer?: {
        name: string | null
        phone: string | null
    }
}

interface UseOperatorOrdersOptions {
    locationId?: string
}

export function useOperatorOrders(options: UseOperatorOrdersOptions = {}) {
    const [orders, setOrders] = useState<OperatorOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Use stable client instance
    const [supabase] = useState(() => createClient())

    // Initialize notification sound
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/new-order.mp3')
        }
    }, [])

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(console.error)
        }
    }, [])

    const fetchOrders = useCallback(async () => {
        // Active orders (confirmed → in_delivery) show ALWAYS regardless of date.
        // Delivered orders only show from today (disappear the next day).
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const query = supabase
            .from('orders')
            .select(`
        *,
        items:order_items(
          *,
          product:products(id, name, image_url),
          variant:product_variants(name)
        ),
        customer:customers(name, phone)
      `)
            .or(`status.in.(confirmed,preparing,ready,awaiting_courier,in_delivery),and(status.eq.delivered,created_at.gte.${today.toISOString()})`)
            .order('created_at', { ascending: true })

        if (options.locationId) {
            query.eq('location_id', options.locationId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
            console.error('Error fetching orders:', fetchError)
            setError('Nie udało się pobrać zamówień')
        } else {
            // Transform variant data
            const transformedOrders = (data || []).map((order: any) => ({
                ...order,
                items: order.items?.map((item: any) => ({
                    ...item,
                    product: item.product,
                    variant_name: item.variant?.name || null,
                })) || [],
                customer: order.customer,
            }))
            setOrders(transformedOrders)
        }
        setIsLoading(false)
    }, [options.locationId, supabase])

    // Subscribe to real-time updates
    useEffect(() => {
        // Initial fetch
        fetchOrders()

        // Subscribe to order changes
        const channel = supabase
            .channel('operator-orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('[Operator] Realtime update:', payload)

                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new as Order
                        if (['confirmed', 'preparing', 'ready', 'awaiting_courier', 'in_delivery', 'delivered'].includes(newOrder.status)) {
                            // Play sound for new confirmed order
                            if (newOrder.status === 'confirmed') {
                                playNotificationSound()
                                toast.success('Nowe zamówienie!', {
                                    description: `Zamówienie #${newOrder.id}`,
                                })
                            }
                            // Refetch to get full order with relations
                            fetchOrders()
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        // Optimistically update local state with new data (merging to preserve relations)
                        // This provides instant feedback without waiting for refetch
                        const updated = payload.new as Order
                        setOrders(prev => prev.map(o =>
                            o.id === updated.id
                                ? { ...o, ...updated, items: o.items, customer: o.customer }
                                : o
                        ))
                    } else if (payload.eventType === 'DELETE') {
                        setOrders(prev => prev.filter(o => o.id !== (payload.old as Order).id))
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Operator] Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    // Optional: show toast connected?
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Operator] Subscription error')
                    toast.error('Błąd połączenia z serwerem aktualizacji')
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchOrders, playNotificationSound, supabase])

    // Update order status
    const updateOrderStatus = useCallback(async (
        orderId: number,
        newStatus: OrderStatus,
        timestampField?: string
    ) => {
        // Optimistic update
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    status: newStatus,
                    [timestampField || 'updated_at']: new Date().toISOString(),
                    items: o.items,
                    customer: o.customer
                }
            }
            return o
        }))

        const updateData: Record<string, any> = { status: newStatus }
        if (timestampField) {
            updateData[timestampField] = new Date().toISOString()
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)

        if (updateError) {
            console.error('Error updating order:', updateError)
            toast.error('Nie udało się zaktualizować statusu')
            // Revert on error? For now, fetchOrders will eventually adhere to truth, 
            // or we could trigger a refetch here.
            fetchOrders()
            return false
        }

        toast.success('Status zaktualizowany')
        return true
    }, [fetchOrders, supabase])

    // Start preparing an order
    const startPreparing = useCallback(async (orderId: number) => {
        return updateOrderStatus(orderId, 'preparing', 'preparing_at')
    }, [updateOrderStatus])

    // Mark order as ready
    const markAsReady = useCallback(async (orderId: number) => {
        return updateOrderStatus(orderId, 'ready', 'ready_at')
    }, [updateOrderStatus])

    // Mark order as awaiting courier
    const awaitingCourier = useCallback(async (orderId: number) => {
        return updateOrderStatus(orderId, 'awaiting_courier')
    }, [updateOrderStatus])

    // Mark order as in delivery
    const markAsInDelivery = useCallback(async (orderId: number) => {
        return updateOrderStatus(orderId, 'in_delivery', 'picked_up_at')
    }, [updateOrderStatus])

    // Mark order as delivered
    const markAsDelivered = useCallback(async (orderId: number) => {
        return updateOrderStatus(orderId, 'delivered', 'delivered_at')
    }, [updateOrderStatus])

    // Filter orders by status
    const newOrders = orders.filter(o => o.status === 'confirmed')
    const preparingOrders = orders.filter(o => o.status === 'preparing')
    // Ready column includes: ready, awaiting_courier (and for pickup: ready is final step before delivered)
    const readyOrders = orders.filter(o => ['ready', 'awaiting_courier'].includes(o.status))
    const inDeliveryOrders = orders.filter(o => o.status === 'in_delivery')
    const deliveredOrders = orders.filter(o => o.status === 'delivered')

    return {
        orders,
        newOrders,
        preparingOrders,
        readyOrders,
        inDeliveryOrders,
        deliveredOrders,
        isLoading,
        error,
        refetch: fetchOrders,
        startPreparing,
        markAsReady,
        awaitingCourier,
        markAsInDelivery,
        markAsDelivered,
    }
}

// Calculate time since order was created
export function getOrderAge(createdAt: string): { minutes: number; label: string; isUrgent: boolean } {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const minutes = Math.floor(diffMs / 60000)

    let label: string
    if (minutes < 1) {
        label = 'Przed chwilą'
    } else if (minutes < 60) {
        label = `${minutes} min temu`
    } else {
        const hours = Math.floor(minutes / 60)
        label = `${hours}h ${minutes % 60}min temu`
    }

    return {
        minutes,
        label,
        isUrgent: minutes > 15,
    }
}
