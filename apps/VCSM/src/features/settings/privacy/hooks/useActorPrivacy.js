import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePrivacySettings } from '@/features/settings/queries/usePrivacySettings'
import { useUpdateVportVisibility } from '@/features/settings/queries/useUpdateVportVisibility'

export function useActorPrivacy(actorId) {
  const { user } = useAuth() || {}
  const userId = user?.id

  const { data: isPrivate = false, isLoading, error: queryError } = usePrivacySettings(actorId)

  const mutation = useUpdateVportVisibility({ actorId, userId })

  const togglePrivacy = useCallback(() => {
    if (!actorId || mutation.isPending) return
    mutation.mutate(!isPrivate)
  }, [actorId, isPrivate, mutation])

  return {
    loading: isLoading || mutation.isPending,
    isPrivate,
    error: queryError?.message ?? mutation.error?.message ?? null,
    togglePrivacy,
  }
}
