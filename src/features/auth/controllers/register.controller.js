import {
  dalMirrorWandersSessionToPrimary,
  dalReadRegisterSession,
  dalSignOutRegisterSession,
  dalSignUpRegisterUser,
  dalUpdateRegisterUser,
  dalUpsertRegisterProfile,
} from '@/features/auth/dal/register.dal'

async function maybeMirrorWandersSession(isWandersFlow) {
  if (!isWandersFlow) return

  const session = await dalReadRegisterSession({ isWandersFlow: true })
  const accessToken = session?.access_token ?? null
  const refreshToken = session?.refresh_token ?? null

  if (!accessToken || !refreshToken) return

  await dalMirrorWandersSessionToPrimary({
    accessToken,
    refreshToken,
  })
}

function isAnonymousUser(user) {
  return Boolean(user?.is_anonymous) || Boolean(user?.app_metadata?.is_anonymous)
}

function isStaleJwtSubjectError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('user from sub claim in jwt does not exist')
}

async function signUpRegisterUserWithRecovery({
  isWandersFlow,
  email,
  password,
}) {
  try {
    return await dalSignUpRegisterUser({ isWandersFlow, email, password })
  } catch (error) {
    if (!isStaleJwtSubjectError(error)) throw error
    await dalSignOutRegisterSession({ isWandersFlow })
    return dalSignUpRegisterUser({ isWandersFlow, email, password })
  }
}

export async function ctrlRegisterAccount({
  email,
  password,
  isWandersFlow = false,
}) {
  const nowIso = new Date().toISOString()
  const existingSession = await dalReadRegisterSession({ isWandersFlow })
  const existingUserId = existingSession?.user?.id ?? null

  const canUpgradeExistingSession = existingUserId && isAnonymousUser(existingSession?.user)

  if (canUpgradeExistingSession) {
    try {
      await dalUpdateRegisterUser({
        isWandersFlow,
        email,
        password,
      })

      await dalUpsertRegisterProfile({
        isWandersFlow,
        userId: existingUserId,
        email,
        updatedAt: nowIso,
      })

      await maybeMirrorWandersSession(isWandersFlow)

      return {
        ok: true,
        requiresEmailConfirm: false,
        userId: existingUserId,
        message: null,
      }
    } catch (error) {
      if (!isStaleJwtSubjectError(error)) throw error
      await dalSignOutRegisterSession({ isWandersFlow })
    }
  }

  const authData = await signUpRegisterUserWithRecovery({
    isWandersFlow,
    email,
    password,
  })
  const newUserId = authData?.user?.id ?? null

  if (!newUserId) {
    return {
      ok: true,
      requiresEmailConfirm: true,
      userId: null,
      message: 'Registration initiated. Please check your email to confirm your account.',
    }
  }

  await dalUpsertRegisterProfile({
    isWandersFlow,
    userId: newUserId,
    email,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await maybeMirrorWandersSession(isWandersFlow)

  return {
    ok: true,
    requiresEmailConfirm: false,
    userId: newUserId,
    message: null,
  }
}
