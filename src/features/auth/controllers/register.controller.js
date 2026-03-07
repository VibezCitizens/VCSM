import {
  dalMirrorWandersSessionToPrimary,
  dalReadRegisterSession,
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

export async function ctrlRegisterAccount({
  email,
  password,
  isWandersFlow = false,
}) {
  const nowIso = new Date().toISOString()
  const existingSession = await dalReadRegisterSession({ isWandersFlow })
  const existingUserId = existingSession?.user?.id ?? null

  if (existingUserId) {
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
  }

  const authData = await dalSignUpRegisterUser({
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
