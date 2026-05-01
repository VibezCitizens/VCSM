import { useCallback } from 'react'
import { saveVportPublicDetailsByActorIdController } from '@/features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller'
import { useProfilesOps } from '@/features/profiles/adapters/profiles.adapter'
import { useIdentity } from '@/state/identity/identityContext'

export function useSaveVportPublicDetailsByActorId() {
  const { invalidateVportPublicDetails } = useProfilesOps()
  const { identity } = useIdentity()

  const saveByActorId = useCallback(async (actorId, payload) => {
    return saveVportPublicDetailsByActorIdController(actorId, payload, {
      requestActorId: identity?.actorId ?? null,
      invalidateVportPublicDetails,
    })
  }, [identity?.actorId, invalidateVportPublicDetails])

  return { saveByActorId }
}
