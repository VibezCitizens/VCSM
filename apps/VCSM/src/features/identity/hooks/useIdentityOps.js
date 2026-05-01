import { refreshVcActorDirectory } from '@/features/identity/controller/refreshActorDirectory.controller'
import { ensureVcsmPlatformBootstrap } from '@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js'

export function useIdentityOps() {
  return { refreshVcActorDirectory, ensureVcsmPlatformBootstrap }
}
