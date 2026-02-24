import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

export interface LoyaltyHistoryEntry {
  id: string
  label: string
  points: number
  type: 'earned' | 'spent' | 'bonus' | 'expired'
  order_id: number | null
  created_at: string
}

interface UseLoyaltyHistoryResult {
  history: LoyaltyHistoryEntry[]
  isLoading: boolean
}

/**
 * Hook for fetching the current user's loyalty point history from Supabase.
 * Replaces the HISTORY mock array.
 */
export function useLoyaltyHistory(): UseLoyaltyHistoryResult {
  const { user, isPermanent } = useAuth()
  const [history, setHistory] = useState<LoyaltyHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !isPermanent) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    supabase
      .from('loyalty_history')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setHistory(data as LoyaltyHistoryEntry[])
        }
        setIsLoading(false)
      })
  }, [user, isPermanent])

  return { history, isLoading }
}
