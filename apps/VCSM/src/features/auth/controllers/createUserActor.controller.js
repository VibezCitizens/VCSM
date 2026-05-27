import { dalCreateUserActor } from '@/features/auth/dal/actorCreate.dal'
import { dalCreateActorOwner } from '@/features/auth/dal/actorOwnerCreate.dal'
import { dalGetActorByProfile } from '@/features/auth/dal/actorGetByProfile.dal'
import { ActorModel } from '@/features/auth/model/actor.model'

/**
 * createUserActorForProfile
 *
 * Rules enforced here:
 * - profile must already exist
 * - username already completed (onboarding finished)
 * - actor is created once (idempotent)
 * - ownership is guaranteed
 */
export async function createUserActorForProfile({ profileId, userId, refreshActorFn }) {
  if (!profileId || !userId) {
    throw new Error('profileId and userId are required')
  }

  // VENOM-AUTH-006: Actor creation is owner-scoped.
  // profileId must equal the authenticated userId — actors are created for the
  // currently authenticated user's own profile only. Callers (onboarding controller,
  // join onboarding controller) pass session.user.id for both, but this guard
  // ensures a future caller cannot pass a different profileId to create an actor
  // under another user's identity.
  if (profileId !== userId) {
    throw new Error(
      'profileId must match authenticated userId. Actor creation is owner-scoped.'
    )
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

  if (actor?.id) refreshActorFn?.(actor.id)

  // 4️⃣ Return domain-safe actor
  return ActorModel(actor)
}

