import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/upgrade-customer
 * Called after supabase.auth.updateUser() upgrades an anonymous user.
 * Updates the customer record: sets email/name, adds registration bonus,
 * generates referral code, logs to loyalty_history.
 *
 * Uses service-role admin client because after updateUser() the client JWT
 * still has the old anonymous user's ID, making RLS-based approaches fail.
 * Verifies the user exists in auth before upgrading.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, marketingConsent } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify this is a real auth user with a matching email
    const { data: { user: authUser }, error: authError } = await admin.auth.admin.getUserById(userId)
    if (authError || !authUser || authUser.email !== email) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
    }

    // Check if customer exists and is anonymous
    const { data: customer } = await admin
      .from('customers')
      .select('id, is_anonymous, loyalty_points, lifetime_points')
      .eq('id', userId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.is_anonymous) {
      return NextResponse.json({ ok: true, message: 'Already permanent' })
    }

    const referralCode = (name || 'MESO').substring(0, 3).toUpperCase()
      + Math.random().toString(36).substring(2, 7).toUpperCase()

    const { error: updateError } = await admin
      .from('customers')
      .update({
        email,
        name: name || email.split('@')[0],
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

    await admin.from('loyalty_history').insert({
      customer_id: userId,
      label: 'Bonus rejestracyjny',
      points: 50,
      type: 'bonus',
    })

    return NextResponse.json({ ok: true, points: customer.loyalty_points + 50 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
