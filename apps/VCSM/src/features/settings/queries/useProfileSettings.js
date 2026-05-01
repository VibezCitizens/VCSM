import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { loadProfileCore } from '@/features/settings/profile/controller/profile.controller.core'

/**
 * User profile settings query.
 * Key: ['settings', 'profile', userId]
 */
export function useProfileSettings(userId) {
  return useQuery({
    queryKey: queryKeys.settingsProfile(userId),
    queryFn: () => loadProfileCore({ subjectId: userId, mode: 'user' }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * VPORT profile settings query.
 * Key: ['settings', 'vport-profile', vportId]
 */
export function useVportProfileSettings(vportId) {
  return useQuery({
    queryKey: queryKeys.settingsVportProfile(vportId),
    queryFn: () => loadProfileCore({ subjectId: vportId, mode: 'vport' }),
    enabled: !!vportId,
    staleTime: 5 * 60 * 1000,
  })
}
