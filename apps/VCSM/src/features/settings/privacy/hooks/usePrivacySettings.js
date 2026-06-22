import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { ctrlGetActorPrivacy } from '@/features/settings/privacy/controller/actorPrivacy.controller'

export function usePrivacySettings(actorId) {
  return useQuery({
    queryKey: queryKeys.settingsPrivacy(actorId),
    queryFn: () => ctrlGetActorPrivacy(actorId),
    enabled: !!actorId,
    staleTime: 5 * 60 * 1000,
  })
}
