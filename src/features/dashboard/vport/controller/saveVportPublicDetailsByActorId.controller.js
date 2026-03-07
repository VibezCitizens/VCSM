import { fetchVportPublicDetailsByActorId } from '@/features/profiles/dal/vportPublicDetails.read.dal'
import { upsertVportPublicDetails } from '@/features/settings/profile/dal/vportPublicDetails.write.dal'

export async function saveVportPublicDetailsByActorIdController(actorId, payload) {
  if (!actorId) throw new Error('saveVportPublicDetailsByActorId: actorId required')

  const details = await fetchVportPublicDetailsByActorId(actorId)
  const vportId = details?.vport_id ?? null

  if (!vportId) throw new Error('Failed to save VPORT details.')

  return upsertVportPublicDetails(vportId, payload || {})
}
