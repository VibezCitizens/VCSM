import { useCallback } from 'react'
import { saveVportPublicDetailsByActorIdController } from '@/features/vportDashboard/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller'
import { useVportProfileOps } from '@/features/profiles/kinds/vport/adapters/vportProfiles.adapter'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'

export function useSaveVportPublicDetailsByActorId() {
  const { invalidateVportPublicDetails } = useVportProfileOps()
  const { identity } = useIdentity()

  const saveByActorId = useCallback(async (actorId, payload) => {
    return saveVportPublicDetailsByActorIdController(actorId, payload, {
      requestActorId: identity?.actorId ?? null,
      invalidateVportPublicDetails,
    })
  }, [identity?.actorId, invalidateVportPublicDetails])

  return { saveByActorId }
}
