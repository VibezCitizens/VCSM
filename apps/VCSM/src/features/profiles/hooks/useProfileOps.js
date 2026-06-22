// [SHARED_ACTOR_PRIMITIVE] — shared actor profile operations (kind-agnostic)
import { invalidateActorProfileCache } from '@/features/profiles/controller/profileCache.controller'

export function useProfileOps() {
  return {
    invalidateActorProfileCache,
  }
}
