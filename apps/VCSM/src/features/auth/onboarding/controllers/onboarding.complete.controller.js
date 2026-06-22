import { createUserActorForProfile } from '@/features/auth/onboarding/controllers/createUserActor.controller'
import { dalGetAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'
import { generateUsernameDAL } from '@/features/auth/onboarding/dal/onboarding.read.dal'
import { upsertCompletedOnboardingProfileDAL } from '@/features/auth/onboarding/dal/onboarding.write.dal'
import {
  computeAgeFromBirthdateModel,
  normalizeOnboardingFormModel,
} from '@/features/auth/shared/model/onboarding.model'
import { acceptCitizenInviteAttribution } from '@/features/initiation/adapters/initiation.adapter'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

const MIN_ONBOARDING_AGE = 13
const MAX_ONBOARDING_AGE = 120

function isAnonymousUser(user) {
  return Boolean(user?.is_anonymous) || Boolean(user?.app_metadata?.is_anonymous)
}

function buildSessionRedirectResult(user) {
  if (!user) {
    return { ok: false, action: 'login', error: null, data: null }
  }
  if (isAnonymousUser(user)) {
    return { ok: false, action: 'register', error: null, data: null }
  }
  return null
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

  if (!normalized.sex) {
    return {
      ok: false,
      action: null,
      error: { message: 'Invalid sex value.' },
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

  if (age < MIN_ONBOARDING_AGE) {
    return {
      ok: false,
      action: null,
      error: { message: `You must be at least ${MIN_ONBOARDING_AGE} years old to join.` },
      data: null,
    }
  }

  if (age > MAX_ONBOARDING_AGE) {
    return {
      ok: false,
      action: null,
      error: { message: 'Invalid birthdate.' },
      data: null,
    }
  }

  // CRIT-1 FIX: Create actor BEFORE writing the completed profile (username).
  // Previous order (profile write → actor create) caused a permanent stuck state:
  // if actor creation failed after the username was written, the bootstrap check
  // would see profileRow?.username as truthy and redirect with 'already_complete',
  // leaving the user with a username but no actor and no way to retry.
  // Fix: actor is created first; profile with username is only written on success.
  const actor = await createUserActorForProfile({
    profileId: user.id,
    userId: user.id,
    refreshActorFn,
  })

  if (!actor?.id) {
    return {
      ok: false,
      action: null,
      error: { message: 'Failed to create your account. Please try again.' },
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

  // SYSTEM B — citizen invite attribution (best-effort, does not block onboarding)
  const citizenInviteCode = user.user_metadata?.citizen_invite_code ?? null
  if (citizenInviteCode) {
    acceptCitizenInviteAttribution({ citizenInviteCode, acceptedActorId: actor.id }).catch((err) => {
      captureFrontendError(err, {
        feature:     'auth',
        module:      'onboarding',
        controller:  'completeOnboarding',
        route:       '/onboarding',
        severity:    'error',
        is_handled:  true,
        tags:        { flow: 'invite_attribution' },
        context:     { stage: 'acceptVibeInvite' },
        breadcrumbs: [{ type: 'invite', message: 'invite_attribution_failed' }],
      })
    })
  }

  // CRIT-2 FIX: Check ensureVcsmPlatformBootstrap return value.
  // Previous code silently discarded the result — a bootstrap failure would return
  // {ok: false, error} which was swallowed, leaving the user with an actor but
  // no platform provisioning (user_app_access, accounts, preferences, etc.).
  const bootstrapResult = await ensureVcsmPlatformBootstrap?.({
    userId: user.id,
    actorId: actor.id,
  })

  if (bootstrapResult !== undefined && !bootstrapResult.ok) {
    return {
      ok: false,
      action: null,
      error: { message: 'Failed to initialize your account. Please try again.' },
      data: null,
    }
  }

  return {
    ok: true,
    action: null,
    error: null,
    data: { userId: user.id },
  }
}
