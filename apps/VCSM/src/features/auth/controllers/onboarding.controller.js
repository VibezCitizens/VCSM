import { createUserActorForProfile } from '@/features/auth/controllers/createUserActor.controller'
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'
import {
  generateUsernameDAL,
  readProfileForOnboardingDAL,
  upsertCompletedOnboardingProfileDAL,
} from '@/features/auth/dal/onboarding.dal'
import {
  computeAgeFromBirthdateModel,
  mapProfileOnboardingRowToFormModel,
  normalizeOnboardingFormModel,
} from '@/features/auth/model/onboarding.model'

function isAnonymousUser(user) {
  return Boolean(user?.is_anonymous) || Boolean(user?.app_metadata?.is_anonymous)
}

function buildSessionRedirectResult(user) {
  if (!user) {
    return {
      ok: false,
      action: 'login',
      error: null,
      data: null,
    }
  }

  if (isAnonymousUser(user)) {
    return {
      ok: false,
      action: 'register',
      error: null,
      data: null,
    }
  }

  return null
}

export async function getOnboardingBootstrapController() {
  const session = await dalGetAuthSession()
  const user = session?.user ?? null
  const authState = buildSessionRedirectResult(user)
  if (authState) return authState

  const profileRow = await readProfileForOnboardingDAL(user.id)

  return {
    ok: true,
    action: null,
    error: null,
    data: {
      userId: user.id,
      form: mapProfileOnboardingRowToFormModel(profileRow),
    },
  }
}

export async function completeOnboardingController({
  userId,
  form,
  ensureVcsmPlatformBootstrap,
  refreshActorFn,
}) {
  const session = await dalGetAuthSession()
  const user = session?.user ?? null
  const authState = buildSessionRedirectResult(user)
  if (authState) return authState

  if (userId && userId !== user.id) {
    return {
      ok: false,
      action: 'login',
      error: { message: 'Session changed. Please try again.' },
      data: null,
    }
  }

  const normalized = normalizeOnboardingFormModel(form)

  if (!normalized.displayName || !normalized.usernameBase || !normalized.birthdate) {
    return {
      ok: false,
      action: null,
      error: { message: 'Please complete all required fields.' },
      data: null,
    }
  }

  const finalUsername = await generateUsernameDAL({
    displayName: normalized.displayName,
    usernameBase: normalized.usernameBase,
  })

  const age = computeAgeFromBirthdateModel(normalized.birthdate)
  if (age == null) {
    return {
      ok: false,
      action: null,
      error: { message: 'Invalid birthdate.' },
      data: null,
    }
  }

  await upsertCompletedOnboardingProfileDAL({
    profileId: user.id,
    displayName: normalized.displayName,
    username: finalUsername,
    birthdate: normalized.birthdate,
    age,
    isAdult: age >= 18,
    sex: normalized.sex,
    updatedAt: new Date().toISOString(),
  })

  const actor = await createUserActorForProfile({
    profileId: user.id,
    userId: user.id,
    refreshActorFn,
  })

  if (actor?.id) {
    await ensureVcsmPlatformBootstrap?.({
      userId: user.id,
      actorId: actor.id,
    })
  }

  return {
    ok: true,
    action: null,
    error: null,
    data: { userId: user.id },
  }
}

/**
 * Bootstraps auth onboarding for the join/barbershop invite flow.
 * Verifies the active session matches userId before any profile write.
 * Callers supply displayName and desiredUsername from server-side user_metadata.
 */
export async function bootstrapJoinOnboardingController({
  userId,
  displayName,
  desiredUsername,
  refreshActorFn,
  ensureVcsmPlatformBootstrap,
}) {
  const session = await dalGetAuthSession()
  const authedId = session?.user?.id ?? null

  if (!authedId || authedId !== userId) {
    throw new Error('Session mismatch. Cannot bootstrap onboarding for this user.')
  }

  const finalUsername = await generateUsernameDAL({
    displayName,
    usernameBase: desiredUsername,
  })

  await upsertCompletedOnboardingProfileDAL({
    profileId: authedId,
    displayName,
    username: finalUsername,
    sex: null,
    updatedAt: new Date().toISOString(),
  })

  const actor = await createUserActorForProfile({
    profileId: authedId,
    userId: authedId,
    refreshActorFn,
  })

  if (actor?.id) {
    await ensureVcsmPlatformBootstrap?.({ userId: authedId, actorId: actor.id })
  }

  return actor
}
