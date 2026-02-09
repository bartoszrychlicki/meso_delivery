import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { P24, P24Notification } from '@/lib/p24'

export async function POST(request: Request) {
    try {
        const body = await request.json() as P24Notification
        const { merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign } = body

        console.log('Received P24 notification:', body)

        const p24 = new P24({
            merchantId: parseInt(process.env.P24_MERCHANT_ID || '0'),
            posId: parseInt(process.env.P24_POS_ID || process.env.P24_MERCHANT_ID || '0'),
            crcKey: process.env.P24_CRC_KEY || '',
            apiKey: process.env.P24_API_KEY || '',
            mode: (process.env.P24_MODE as 'sandbox' | 'production') || 'sandbox',
        })

        // Verify transaction
        const isValid = await p24.verifyTransaction(body)

        if (!isValid) {
            console.error('Invalid P24 signature or verification failed')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // Parse order ID from sessionId or use returned orderId if P24 sends our ID there?
        // P24 'orderId' in notification is P24's transaction ID, NOT our database ID.
        // Our database ID is usually embedded in 'sessionId' or passed as 'p24_session_id'.
        // logic: sessionId was `${order.id}-${timestamp}`
        const paramOrderId = sessionId.split('-')[0]

        if (!paramOrderId) {
            console.error('Could not extract order ID from session ID:', sessionId)
            return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 })
        }

        const supabase = await createClient()

        // Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
                // Optionally store P24 transaction ID
                // p24_transaction_id: orderId 
            })
            .eq('id', paramOrderId)

        if (updateError) {
            console.error('Failed to update order status:', updateError)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        return NextResponse.json({ status: 'OK' })

    } catch (error) {
        console.error('P24 status error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
