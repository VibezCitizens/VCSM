import { dalGetAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'
import { readProfileForOnboardingDAL } from '@/features/auth/onboarding/dal/onboarding.read.dal'
import { mapProfileOnboardingRowToFormModel } from '@/features/auth/shared/model/onboarding.model'

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

export async function getOnboardingBootstrapController() {
  const session = await dalGetAuthSession()
  const user = session?.user ?? null
  const authState = buildSessionRedirectResult(user)
  if (authState) return authState

  const profileRow = await readProfileForOnboardingDAL(user.id)

  // username is only written by upsertCompletedOnboardingProfileDAL — its presence
  // means onboarding was already completed. isProfileShellIncompleteModel requires
  // a full profile row (display_name, sex, age) that this DAL does not select.
  if (profileRow?.username) {
    return {
      ok: false,
      action: 'already_complete',
      error: null,
      data: null,
    }
  }

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
