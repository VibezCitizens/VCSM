// [SHARED_ACTOR_PRIMITIVE] — polymorphic slug resolution for both citizen and vport actors
import { resolveActorBySlugOrUsernameDAL } from '@/features/profiles/dal/resolveActorSlug.dal'

export async function resolveActorBySlugController(slugOrUsername) {
  return resolveActorBySlugOrUsernameDAL(slugOrUsername)
}
