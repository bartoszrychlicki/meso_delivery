import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/upgrade-customer
 * Backup endpoint called after supabase.auth.updateUser() upgrades an anonymous user.
 * Updates the customer record: sets email/name, adds registration bonus,
 * generates referral code, logs to loyalty_history.
 *
 * The primary upgrade path is the AFTER UPDATE trigger on auth.users
 * (see 20260231_upgrade_on_email_update.sql). This endpoint is a fallback
 * in case the trigger hasn't fired yet (e.g., email not yet set on auth user).
 *
 * Accepts email from form data and looks up the auth user by email using
 * an RPC function, because after updateUser() the client JWT still has
 * the old anonymous user's ID.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, marketingConsent } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the auth user by email using RPC (efficient single query)
    const { data: userId, error: rpcError } = await admin.rpc(
      'get_auth_user_id_by_email',
      { lookup_email: email }
    )

    if (rpcError || !userId) {
      // User may not exist yet (email not confirmed). That's OK —
      // the AFTER UPDATE trigger will handle it when the email is set.
      return NextResponse.json({ ok: true, message: 'Deferred to trigger' })
    }

    // Check if customer exists and is anonymous
    const { data: customer } = await admin
      .from('crm_customers')
      .select('id, is_anonymous, loyalty_points, lifetime_points')
      .eq('id', userId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.is_anonymous) {
      // Already upgraded (trigger may have handled it)
      return NextResponse.json({ ok: true, message: 'Already permanent' })
    }

    const referralCode = (name || 'MESO').substring(0, 3).toUpperCase()
      + Math.random().toString(36).substring(2, 7).toUpperCase()

    const { error: updateError } = await admin
      .from('crm_customers')
      .update({
        email,
        first_name: (name || email.split('@')[0]).split(' ')[0],
        last_name: (name || email.split('@')[0]).split(' ')[1] || '',
        is_anonymous: false,
        marketing_consent: !!marketingConsent,
        loyalty_points: customer.loyalty_points + 50,
        lifetime_points: customer.lifetime_points + 50,
        referral_code: referralCode,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Upgrade customer error:', updateError)
      return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
    }

    await admin.from('crm_loyalty_transactions').insert({
      customer_id: userId,
      label: 'Bonus rejestracyjny',
      amount: 50,
      reason: 'bonus',
    })

    return NextResponse.json({ ok: true, points: customer.loyalty_points + 50 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
