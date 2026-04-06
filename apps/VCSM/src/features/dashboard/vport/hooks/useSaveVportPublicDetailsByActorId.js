import { useCallback } from 'react'

import { saveVportPublicDetailsByActorIdController } from '@/features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller'

export function useSaveVportPublicDetailsByActorId() {
  const saveByActorId = useCallback(async (actorId, payload) => {
    return saveVportPublicDetailsByActorIdController(actorId, payload)
  }, [])

  return { saveByActorId }
}
