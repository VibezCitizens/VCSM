import { dalGetAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'
import { generateUsernameDAL } from '@/features/auth/onboarding/dal/onboarding.read.dal'
import { upsertCompletedOnboardingProfileDAL } from '@/features/auth/onboarding/dal/onboarding.write.dal'
import { computeAgeFromBirthdateModel } from '@/features/auth/shared/model/onboarding.model'
import { createUserActorForProfile } from '@/features/auth/onboarding/controllers/createUserActor.controller'

const MIN_JOIN_ONBOARDING_AGE = 18
const MAX_ONBOARDING_AGE = 120

/**
 * Bootstraps auth onboarding for the join/barbershop invite flow.
 * Verifies the active session matches userId before any profile write.
 * Callers supply displayName and desiredUsername from server-side user_metadata.
 */
export async function bootstrapJoinOnboardingController({
  userId,
  displayName,
  desiredUsername,
  birthdate,
  refreshActorFn,
  ensureVcsmPlatformBootstrap,
}) {
  const session = await dalGetAuthSession()
  const authedId = session?.user?.id ?? null

  if (!authedId || authedId !== userId) {
    throw new Error('Session mismatch. Cannot bootstrap onboarding for this user.')
  }

  if (!birthdate) {
    throw new Error('Birthdate is required to complete onboarding.')
  }

  const age = computeAgeFromBirthdateModel(birthdate)
  if (age == null) {
    throw new Error('Invalid birthdate.')
  }
  if (age < MIN_JOIN_ONBOARDING_AGE) {
    throw new Error(`You must be at least ${MIN_JOIN_ONBOARDING_AGE} years old to join.`)
  }
  if (age > MAX_ONBOARDING_AGE) {
    throw new Error('Invalid birthdate.')
  }

  const finalUsername = await generateUsernameDAL({
    displayName,
    usernameBase: desiredUsername,
  })

  // CRIT-1 FIX: Create actor BEFORE writing the completed profile (username).
  // If actor creation fails after the username was set, the user would be permanently
  // stuck — the 'already_complete' bootstrap check would fire on next visit.
  const actor = await createUserActorForProfile({
    profileId: authedId,
    userId: authedId,
    refreshActorFn,
  })

  if (!actor?.id) {
    throw new Error('Failed to create actor. Please try again.')
  }

  await upsertCompletedOnboardingProfileDAL({
    profileId: authedId,
    displayName,
    username: finalUsername,
    birthdate,
    age,
    isAdult: age >= 18,
    sex: null,
    updatedAt: new Date().toISOString(),
  })

  // CRIT-2 FIX: Check ensureVcsmPlatformBootstrap return value.
  // Previous code silently discarded the result — {ok: false} was swallowed,
  // leaving users without platform provisioning.
  const bootstrapResult = await ensureVcsmPlatformBootstrap?.({ userId: authedId, actorId: actor.id })
  if (bootstrapResult !== undefined && !bootstrapResult.ok) {
    throw new Error('Failed to initialize your account. Please try again.')
  }

  return actor
}
