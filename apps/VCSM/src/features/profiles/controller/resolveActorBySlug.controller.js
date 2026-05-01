import { resolveActorBySlugOrUsernameDAL } from '@/features/profiles/dal/resolveActorSlug.dal'

export async function resolveActorBySlugController(slugOrUsername) {
  return resolveActorBySlugOrUsernameDAL(slugOrUsername)
}
