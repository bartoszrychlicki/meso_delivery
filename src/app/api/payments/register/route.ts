import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerTransaction } from '@/lib/p24'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      deliveryType,
      deliveryAddress,
      scheduledTime,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      tip,
      promoDiscount,
      total,
      notes,
      contactEmail,
      contactName,
      contactPhone,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Koszyk jest pusty' }, { status: 400 })
    }

    // Get active location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Nie znaleziono aktywnej restauracji' }, { status: 400 })
    }

    // Create order with pending_payment status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        location_id: location.id,
        status: 'pending_payment',
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        scheduled_time: scheduledTime || null,
        payment_method: paymentMethod,
        payment_status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        tip: tip || 0,
        promo_discount: promoDiscount || 0,
        total,
        loyalty_points_earned: Math.floor(total),
        notes: notes || null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[Payment] Order creation error:', orderError)
      return NextResponse.json({ error: 'Błąd podczas tworzenia zamówienia' }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: {
      productId: string
      quantity: number
      price: number
      variantPrice?: number
      variantId?: string
      variantName?: string
      spiceLevel?: number
      addons: { id: string; name: string; price: number }[]
    }) => {
      const basePrice = item.price + (item.variantPrice || 0)
      const addonsPrice = item.addons.reduce((sum: number, addon: { price: number }) => sum + addon.price, 0)
      const unitPrice = basePrice + addonsPrice
      const totalPrice = unitPrice * item.quantity

      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: unitPrice,
        spice_level: item.spiceLevel,
        variant_id: item.variantId,
        variant_name: item.variantName,
        addons: item.addons,
        total_price: totalPrice,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[Payment] Order items error:', itemsError)
      return NextResponse.json({ error: 'Błąd podczas dodawania produktów' }, { status: 500 })
    }

    // For cash payments - skip P24, confirm immediately
    if (paymentMethod === 'cash') {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      return NextResponse.json({
        orderId: order.id,
        paymentMethod: 'cash',
        redirectUrl: null,
      })
    }

    // Register P24 transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sessionId = `order_${order.id}_${Date.now()}`
    const amountInGrosze = Math.round(total * 100)

    const p24Result = await registerTransaction({
      sessionId,
      amount: amountInGrosze,
      description: `MESO Food - zamówienie #${order.id}`,
      email: contactEmail || user.email || '',
      client: contactName,
      phone: contactPhone,
      urlReturn: `${appUrl}/payment/return?orderId=${order.id}`,
      urlStatus: `${appUrl}/api/payments/callback`,
    })

    // Save P24 session ID to order for later verification
    await supabase
      .from('orders')
      .update({ p24_session_id: sessionId })
      .eq('id', order.id)

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: 'p24',
      redirectUrl: p24Result.redirectUrl,
      token: p24Result.token,
    })
  } catch (error) {
    console.error('[Payment] Registration error:', error)
    const message = error instanceof Error ? error.message : 'Błąd rejestracji płatności'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
