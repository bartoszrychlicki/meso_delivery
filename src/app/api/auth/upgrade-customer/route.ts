import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/upgrade-customer
 * Called after supabase.auth.updateUser() upgrades an anonymous user.
 * Updates the customer record: sets email/name, adds registration bonus,
 * generates referral code, logs to loyalty_history.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, marketingConsent } = await request.json()

    // Check if customer exists and is anonymous
    const { data: customer } = await supabase
      .from('customers')
      .select('id, is_anonymous, loyalty_points, lifetime_points')
      .eq('id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Only upgrade if currently anonymous
    if (!customer.is_anonymous) {
      return NextResponse.json({ ok: true, message: 'Already permanent' })
    }

    const referralCode = (name || 'MESO').substring(0, 3).toUpperCase()
      + Math.random().toString(36).substring(2, 7).toUpperCase()

    // Update customer record with registration bonus (+50 points)
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        email: user.email,
        name: name || user.email?.split('@')[0],
        is_anonymous: false,
        marketing_consent: !!marketingConsent,
        loyalty_points: customer.loyalty_points + 50,
        lifetime_points: customer.lifetime_points + 50,
        referral_code: referralCode,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Upgrade customer error:', updateError)
      return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
    }

    // Log registration bonus to history
    await supabase.from('loyalty_history').insert({
      customer_id: user.id,
      label: 'Bonus rejestracyjny',
      points: 50,
      type: 'bonus',
    })

    return NextResponse.json({ ok: true, points: customer.loyalty_points + 50 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
