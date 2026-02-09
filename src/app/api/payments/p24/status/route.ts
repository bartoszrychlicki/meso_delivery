import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js' // Direct client for Service Role
import { P24, P24Notification } from '@/lib/p24'

export async function POST(request: Request) {
    try {
        const body = await request.json() as P24Notification
        const { merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign } = body

        console.log('[P24 Status] Received notification:', JSON.stringify(body, null, 2))

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
            console.error('[P24 Status] Invalid signature or verification failed. Body:', body)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        console.log('[P24 Status] Signature verified successfully.')

        // Parse order ID from sessionId or use returned orderId if P24 sends our ID there?
        // P24 'orderId' in notification is P24's transaction ID, NOT our database ID.
        // Our database ID is usually embedded in 'sessionId' or passed as 'p24_session_id'.
        // logic: sessionId was `${order.id}-${timestamp}`
        const paramOrderId = sessionId.split('-')[0]

        console.log(`[P24 Status] Extracted Order ID: ${paramOrderId} from Session ID: ${sessionId}`)

        if (!paramOrderId) {
            console.error('[P24 Status] Could not extract order ID from session ID:', sessionId)
            return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 })
        }

        // Initialize Admin Client to bypass RLS for status updates
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )


        // Update order status with Admin/Service Role client
        const { error: updateError, data: updatedOrder } = await supabaseAdmin
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
            .select() // Select to verify update
            .single()

        if (updateError) {
            console.error('[P24 Status] Failed to update order status:', updateError)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log('[P24 Status] Order updated successfully:', updatedOrder)

        return NextResponse.json({ status: 'OK' })

    } catch (error) {
        console.error('P24 status error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
