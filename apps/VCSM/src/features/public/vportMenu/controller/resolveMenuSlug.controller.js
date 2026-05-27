import { resolveMenuSlugDAL } from '@/features/public/vportMenu/dal/resolveMenuSlug.dal'

export async function resolveMenuSlugController(slug) {
  return resolveMenuSlugDAL(slug)
}
