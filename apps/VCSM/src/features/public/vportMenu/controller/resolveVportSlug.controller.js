import { resolveVportSlugDAL } from '@/features/public/vportMenu/dal/resolveVportSlug.dal'

export async function resolveVportSlugController(slug) {
  return resolveVportSlugDAL(slug)
}
