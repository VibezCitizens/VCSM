import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { ctrlResolveVportIdByActorId } from '@/features/settings/account/controller/account.controller'

/**
 * Resolves the vportId for the currently active VPORT actor.
 * Only enabled when the identity is in vport mode.
 */
export function useAccountSettings({ actorId, isVport } = {}) {
  return useQuery({
    queryKey: queryKeys.settingsAccount(actorId),
    queryFn: () => ctrlResolveVportIdByActorId(actorId),
    enabled: !!actorId && !!isVport,
    staleTime: 10 * 60 * 1000,
  })
}
