import { useQuery } from '@tanstack/react-query'
import { ctrlGetProfileActorId } from '@/features/settings/vports/controller/getProfileActorId.controller'

export function useProfileActor(userId) {
  const { data: profileActorId = null } = useQuery({
    queryKey: ['settings', 'profile-actor', userId],
    queryFn: () => ctrlGetProfileActorId({ userId }),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  })

  return profileActorId
}
