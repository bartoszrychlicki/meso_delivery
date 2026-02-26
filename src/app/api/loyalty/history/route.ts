import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LoyaltyHistoryResponseRow = {
  id: string
  label: string
  points: number
  type: string
  created_at: string
  order_id?: number | null
  is_pending_confirmation?: boolean
  pending_message?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = 20
    const offset = page * limit

    const { data: history, error, count } = await supabase
      .from('loyalty_history')
      .select('*', { count: 'exact' })
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Błąd pobierania historii' }, { status: 500 })
    }

    let mergedHistory: LoyaltyHistoryResponseRow[] = (history || []) as LoyaltyHistoryResponseRow[]

    // On the first page, prepend "pending confirmation" entries for paid orders
    // that have not yet reached delivered status. This keeps the UX aligned with
    // the order-confirmation screen while points are still awarded on delivery.
    if (page === 0) {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, status, payment_status, loyalty_points_earned, created_at, paid_at, confirmed_at')
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid')
        .gt('loyalty_points_earned', 0)
        .order('created_at', { ascending: false })
        .limit(5)

      const pendingRows: LoyaltyHistoryResponseRow[] = (pendingOrders || [])
        .filter((order) => order.status !== 'delivered' && order.status !== 'cancelled')
        .map((order) => ({
          id: `pending-order-${order.id}`,
          label: `Zamówienie #${order.id}`,
          points: order.loyalty_points_earned ?? 0,
          type: 'pending_confirmation',
          order_id: order.id,
          created_at: order.paid_at || order.confirmed_at || order.created_at,
          is_pending_confirmation: true,
          pending_message: 'Punkty w trakcie potwierdzania. Gdy odbierzesz swoje zamówienie, naliczymy Ci punkty.',
        }))

      if (pendingRows.length > 0) {
        mergedHistory = [...pendingRows, ...mergedHistory].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
    }

    // Reconciliation check: compare sum of history with actual balance
    let balanceMismatch = false
    if (page === 0) {
      const { data: sumResult } = await supabase
        .from('loyalty_history')
        .select('points')
        .eq('customer_id', user.id)

      if (sumResult) {
        const historySum = sumResult.reduce((acc, row) => acc + (row.points ?? 0), 0)

        const { data: customer } = await supabase
          .from('customers')
          .select('loyalty_points')
          .eq('id', user.id)
          .single()

        if (customer && historySum !== customer.loyalty_points) {
          balanceMismatch = true
        }
      }
    }

    return NextResponse.json({
      history: mergedHistory,
      total: count || 0,
      page,
      hasMore: (count || 0) > offset + limit,
      ...(balanceMismatch ? { balance_mismatch: true } : {}),
    })

  } catch {
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 })
  }
}
