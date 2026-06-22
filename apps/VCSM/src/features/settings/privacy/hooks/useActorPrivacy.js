import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { usePrivacySettings } from '@/features/settings/privacy/hooks/usePrivacySettings'
import { useUpdateVportVisibility } from '@/features/settings/privacy/hooks/useUpdateVportVisibility'

export function useActorPrivacy(actorId) {
  const { user } = useAuth() || {}
  const userId = user?.id
  const { identity } = useIdentity()
  const callerActorId = identity?.actorId ?? null

  const { data: isPrivate = false, isLoading, error: queryError } = usePrivacySettings(actorId)

  const mutation = useUpdateVportVisibility({ actorId, userId, callerActorId })

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
