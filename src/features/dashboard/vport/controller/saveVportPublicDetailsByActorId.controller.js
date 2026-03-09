import { fetchVportPublicDetailsByActorId } from '@/features/profiles/adapters/dal/vportPublicDetails.read.dal.adapter'
import { upsertVportPublicDetails } from '@/features/settings/adapters/profile/dal/vportPublicDetails.write.dal.adapter'

export async function saveVportPublicDetailsByActorIdController(actorId, payload) {
  if (!actorId) throw new Error('saveVportPublicDetailsByActorId: actorId required')

  const details = await fetchVportPublicDetailsByActorId(actorId)
  const vportId = details?.vport_id ?? null

  if (!vportId) throw new Error('Failed to save VPORT details.')

  return upsertVportPublicDetails(vportId, payload || {})
}
