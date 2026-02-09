import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyNotificationSign, verifyTransaction, type P24Notification } from '@/lib/p24'

// P24 sends callback as POST with form-encoded or JSON body
// This endpoint is called server-to-server, no user auth needed
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let notification: P24Notification

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      notification = {
        merchantId: Number(formData.get('merchantId')),
        posId: Number(formData.get('posId')),
        sessionId: String(formData.get('sessionId')),
        amount: Number(formData.get('amount')),
        originAmount: Number(formData.get('originAmount')),
        currency: String(formData.get('currency')),
        orderId: Number(formData.get('orderId')),
        methodId: Number(formData.get('methodId')),
        statement: String(formData.get('statement') || ''),
        sign: String(formData.get('sign')),
      }
    } else {
      notification = await request.json()
    }

    console.log('[P24 Callback] Received notification:', {
      sessionId: notification.sessionId,
      orderId: notification.orderId,
      amount: notification.amount,
    })

    // Verify the notification sign
    if (!verifyNotificationSign(notification)) {
      console.error('[P24 Callback] Invalid sign!')
      return NextResponse.json({ error: 'Invalid sign' }, { status: 400 })
    }

    console.log('[P24 Callback] Sign verified OK')

    // Verify the transaction with P24
    const verified = await verifyTransaction({
      sessionId: notification.sessionId,
      orderId: notification.orderId,
      amount: notification.amount,
      currency: notification.currency,
    })

    if (!verified) {
      console.error('[P24 Callback] Transaction verification failed')
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    console.log('[P24 Callback] Transaction verified with P24')

    // Extract our order ID from sessionId (format: "order_{id}_{timestamp}")
    const sessionParts = notification.sessionId.split('_')
    const ourOrderId = parseInt(sessionParts[1], 10)

    if (isNaN(ourOrderId)) {
      console.error('[P24 Callback] Cannot parse order ID from sessionId:', notification.sessionId)
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 })
    }

    // Use service role key to bypass RLS (server-to-server callback, no user session)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('[P24 Callback] SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
    )

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: now,
        confirmed_at: now,
        p24_order_id: notification.orderId,
      })
      .eq('id', ourOrderId)
      .eq('payment_status', 'pending') // Only update if still pending (idempotency)

    if (updateError) {
      console.error('[P24 Callback] DB update error:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log('[P24 Callback] Order', ourOrderId, 'confirmed and paid')

    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('[P24 Callback] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
