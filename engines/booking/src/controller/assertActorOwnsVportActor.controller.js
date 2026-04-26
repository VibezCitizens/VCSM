import { dalGetActorById, dalReadActorOwnerLink } from '../dal/actor.read.dal.js'

export async function assertActorOwnsVportActor({ requestActorId, targetActorId } = {}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!targetActorId)  throw new Error('[BookingEngine] targetActorId is required')

  if (String(requestActorId) === String(targetActorId)) {
    return { ok: true, mode: 'self' }
  }

  const requester = await dalGetActorById({ actorId: requestActorId })
  if (!requester || requester.is_void === true) {
    throw new Error('Requester actor not found.')
  }
  if (requester.kind !== 'user') {
    throw new Error('Only actor owners can manage this booking resource.')
  }

  const profileId = requester.profile_id ?? null
  if (!profileId) {
    throw new Error('Requester actor is missing profile ownership identity.')
  }

  const ownerLink = await dalReadActorOwnerLink({ targetActorId, userProfileId: profileId })
  if (!ownerLink || ownerLink.is_void === true) {
    throw new Error('Actor does not own this vport actor.')
  }

  return { ok: true, mode: 'actor_owner', ownerLink }
}
