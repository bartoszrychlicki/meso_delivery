import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ coupon: null })
    }

    const admin = createAdminClient()

    // Expire stale coupons first (lazy cleanup)
    await admin
      .from('loyalty_coupons')
      .update({ status: 'expired' })
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())

    // Fetch active coupon
    const { data: coupon } = await admin
      .from('loyalty_coupons')
      .select('id, code, coupon_type, discount_value, free_product_name, expires_at, source')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    return NextResponse.json({ coupon: coupon || null })

  } catch {
    return NextResponse.json({ coupon: null })
  }
}
