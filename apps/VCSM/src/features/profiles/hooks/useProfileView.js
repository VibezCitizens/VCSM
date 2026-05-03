import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { getProfileView } from '@/features/profiles/controller/getProfileView.controller'

export function useProfileView({
  viewerActorId,
  profileActorId,
  canViewContent,
}) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.profileView(viewerActorId, profileActorId, canViewContent),
    queryFn: () => getProfileView({ viewerActorId, profileActorId, canViewContent }),
    enabled: canViewContent !== undefined && !!profileActorId && !!viewerActorId,
    staleTime: 60_000,
    gcTime: 300_000,
    placeholderData: keepPreviousData,
  })

  if (import.meta.env.DEV && isFetching && data) {
    performance.mark('profile:server-reconciled')
  }

  return {
    loading: isLoading,
    isFetching,
    error: error ?? null,
    profile: data?.profile ?? null,
  }
}
