import { createVport, restoreVport } from '@/features/vport/controllers/vportCoreOps.controller'

export function useVportCoreOps() {
  return { createVport, restoreVport }
}
