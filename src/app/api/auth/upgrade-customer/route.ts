import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/upgrade-customer
 * Called after supabase.auth.updateUser() upgrades an anonymous user.
 * Updates the customer record: sets email/name, adds registration bonus,
 * generates referral code, logs to loyalty_history.
 *
 * Uses the access_token from the request body for auth verification
 * because cookies may not be updated yet after updateUser().
 */
export async function POST(request: NextRequest) {
  try {
    const { name, marketingConsent, accessToken } = await request.json()

    // Verify the user via access token (passed from client after updateUser)
    // Fall back to cookie-based auth if no token provided
    let userId: string
    let userEmail: string | undefined

    if (accessToken) {
      // Create a client authenticated with the user's access token
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      )
      const { data: { user }, error } = await userClient.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = user.id
      userEmail = user.email ?? undefined
    } else {
      // Fallback: cookie-based auth
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
      userEmail = user.email ?? undefined
    }

    // Use admin client for DB operations (bypasses RLS)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if customer exists and is anonymous
    const { data: customer } = await admin
      .from('customers')
      .select('id, is_anonymous, loyalty_points, lifetime_points')
      .eq('id', userId)
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
    const { error: updateError } = await admin
      .from('customers')
      .update({
        email: userEmail,
        name: name || userEmail?.split('@')[0],
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

    // Log registration bonus to history
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
