import { resolveVportSlugDAL } from '../dal/resolveVportSlug.dal'

export async function resolveVportSlugController(slug) {
  return resolveVportSlugDAL(slug)
}
