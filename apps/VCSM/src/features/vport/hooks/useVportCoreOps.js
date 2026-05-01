import { createVport, restoreVport } from '@/features/vport/controller/vportCoreOps.controller'

export function useVportCoreOps() {
  return { createVport, restoreVport }
}
