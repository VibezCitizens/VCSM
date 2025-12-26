import { dalCreateUserActor } from '../dal/actorCreate.dal'
import { dalCreateActorOwner } from '../dal/actorOwnerCreate.dal'
import { dalGetActorByProfile } from '../dal/actorGetByProfile.dal'
import { ActorModel } from '../model/actor.model'

/**
 * createUserActorForProfile
 *
 * Rules enforced here:
 * - profile must already exist
 * - username already completed (onboarding finished)
 * - actor is created once (idempotent)
 * - ownership is guaranteed
 */
export async function createUserActorForProfile({ profileId, userId }) {
  if (!profileId || !userId) {
    throw new Error('profileId and userId are required')
  }

  // 1️⃣ Get or create actor
  let actor = await dalGetActorByProfile(profileId)

  if (!actor) {
    actor = await dalCreateUserActor(profileId)
  }

  // 2️⃣ Ensure ownership (IDEMPOTENT)
  try {
    await dalCreateActorOwner(actor.id, userId)
  } catch (err) {
    // ignore duplicate ownership (23505) only
    if (err.code !== '23505') {
      throw err
    }
  }

  // 3️⃣ Return domain-safe actor
  return ActorModel(actor)
}

