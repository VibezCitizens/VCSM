import { refreshVcActorDirectory } from '@/features/identity/controllers/refreshActorDirectory.controller'
import { ensureVcsmPlatformBootstrap } from '@/features/identity/controllers/ensureVcsmPlatformBootstrap.controller.js'

export function useIdentityOps() {
  return { refreshVcActorDirectory, ensureVcsmPlatformBootstrap }
}
