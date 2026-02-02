// Re-export useAuth from AuthProvider for convenience
export { useAuth } from '@/providers/AuthProvider'

// Additional auth utility hook for checking specific permissions
import { useAuth as useAuthBase } from '@/providers/AuthProvider'

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
 * Hook for getting user display info
 * Returns appropriate display name for anonymous vs permanent users
 */
export function useUserDisplay() {
  const { user, isAnonymous, isPermanent } = useAuthBase()

  const displayName = isPermanent
    ? user?.user_metadata?.name || user?.email?.split('@')[0] || 'Użytkownik'
    : 'Gość'

  const avatarInitial = isPermanent
    ? (user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
    : 'G'

  return {
    displayName,
    avatarInitial,
    email: isPermanent ? user?.email : null,
    isAnonymous,
    isPermanent,
  }
}
