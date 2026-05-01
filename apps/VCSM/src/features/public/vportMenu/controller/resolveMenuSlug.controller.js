import { resolveMenuSlugDAL } from '../dal/resolveMenuSlug.dal'

export async function resolveMenuSlugController(slug) {
  return resolveMenuSlugDAL(slug)
}
