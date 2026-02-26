// Re-export useAuth from AuthProvider for convenience
export { useAuth } from '@/providers/AuthProvider'

// Additional auth utility hook for checking specific permissions
import { useState, useEffect } from 'react'
import { useAuth as useAuthBase } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook for checking if user can access MESO Club features
 * Only permanent (non-anonymous) users can use loyalty features
 */
export function useMesoClub() {
  const { isPermanent, isLoading } = useAuthBase()

  return {
    canUseRewards: isPermanent,
    canEarnPoints: isPermanent,
    canUseReferralCode: isPermanent,
    isLoading,
  }
}

/**
 * Resolve display name from user metadata, preferring full_name > first+last > name > email prefix
 */
function resolveMetadataName(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim()
  const first = typeof meta.first_name === 'string' ? meta.first_name.trim() : ''
  const last = typeof meta.last_name === 'string' ? meta.last_name.trim() : ''
  if (first || last) return `${first} ${last}`.trim()
  if (typeof meta.name === 'string' && meta.name.trim()) return meta.name.trim()
  return null
}

/**
 * Hook for getting user display info
 * Returns appropriate display name for anonymous vs permanent users
 * Prefers customers.name, then user metadata, then email prefix
 */
export function useUserDisplay() {
  const { user, isAnonymous, isPermanent } = useAuthBase()
  const [customerName, setCustomerName] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !isPermanent) return

    const supabase = createClient()
    supabase
      .from('customers')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.name && typeof data.name === 'string') {
          const normalized = data.name.trim()
          if (normalized) setCustomerName(normalized)
        }
      })
  }, [user, isPermanent])

  const metadataName = resolveMetadataName(user?.user_metadata)

  const displayName = isPermanent
    ? customerName || metadataName || user?.email?.split('@')[0] || 'Użytkownik'
    : 'Gość'

  const avatarInitial = isPermanent
    ? (customerName?.[0] || metadataName?.[0] || user?.email?.[0] || 'U').toUpperCase()
    : 'G'

  return {
    displayName,
    avatarInitial,
    email: isPermanent ? user?.email : null,
    isAnonymous,
    isPermanent,
  }
}
