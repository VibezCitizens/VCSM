import { ctrlResolveVportIdByActorId, ctrlRestoreVport } from '@/features/settings/account/controller/account.controller'
import { useVportCoreOps } from '@/features/vport/adapters/vport.public.adapter'

export function useVportAccountOps() {
  const { restoreVport } = useVportCoreOps()

  return {
    resolveVportIdByActorId: ctrlResolveVportIdByActorId,
    restoreVport: (params) => ctrlRestoreVport({ ...params, restoreVportFn: restoreVport }),
  }
}
