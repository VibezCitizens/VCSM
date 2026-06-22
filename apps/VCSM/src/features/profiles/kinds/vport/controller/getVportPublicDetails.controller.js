import { fetchVportPublicDetailsByActorId } from '@/features/profiles/kinds/vport/dal/vportPublicDetails.read.dal'
import { readVportTypeDAL } from '@/features/profiles/kinds/vport/dal/readVportType.dal'
import { mapVportPublicDetailsModel } from '@/features/profiles/kinds/vport/model/mapVportPublicDetails.model'
import { createTTLCache } from '@/shared/lib/ttlCache'

const cache = createTTLCache(60_000) // 60 seconds

export async function getVportPublicDetailsController(actorId) {
  if (!actorId) return null

  const cached = cache.get(actorId)
  if (cached) return cached

  const [raw, vportTypeRow] = await Promise.all([
    fetchVportPublicDetailsByActorId(actorId),
    readVportTypeDAL(actorId),
  ])

  const out = mapVportPublicDetailsModel(raw, vportTypeRow)
  cache.set(actorId, out)
  return out
}

export function invalidateVportPublicDetails(actorId) {
  cache.invalidate(actorId)
}
