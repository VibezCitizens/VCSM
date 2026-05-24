import { getWandersSupabase } from '@/features/wanders/adapters/services/wandersSupabaseClient.adapter'
import {
  dalMirrorWandersSessionToPrimary,
  dalReadRegisterSession,
  dalSignOutRegisterSession,
  dalSignUpRegisterUser,
  dalUpdateRegisterUser,
  dalUpsertRegisterProfile,
} from '@/features/auth/dal/register.dal'

function resolveRegisterClient(isWandersFlow) {
  return isWandersFlow ? getWandersSupabase() : undefined
}

// VENOM-AUTH-003: expectedUserId is required when isWandersFlow is true.
// Before injecting Wanders session tokens into the primary Supabase client,
// we verify the Wanders session belongs to the same user who just registered.
// A stale or mismatched Wanders session would otherwise overwrite the primary
// client session with a different user's tokens via setSession().
async function maybeMirrorWandersSession(isWandersFlow, expectedUserId) {
  if (!isWandersFlow) return

  const client = resolveRegisterClient(isWandersFlow)
  const session = await dalReadRegisterSession({ client })

  // Guard: abort if no session or if it belongs to a different user.
  if (!session) return
  if (session.user?.id !== expectedUserId) {
    throw new Error(
      `Wanders session user (${session.user?.id ?? 'none'}) does not match ` +
      `registration user (${expectedUserId ?? 'none'}). Aborting session mirror.`
    )
  }

  const accessToken = session.access_token ?? null
  const refreshToken = session.refresh_token ?? null

  if (!accessToken || !refreshToken) return

  await dalMirrorWandersSessionToPrimary({ accessToken, refreshToken })
}

function isAnonymousUser(user) {
  return Boolean(user?.is_anonymous) || Boolean(user?.app_metadata?.is_anonymous)
}

function isStaleJwtSubjectError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('user from sub claim in jwt does not exist')
}

async function signUpRegisterUserWithRecovery({ isWandersFlow, email, password }) {
  const client = resolveRegisterClient(isWandersFlow)
  try {
    return await dalSignUpRegisterUser({ client, email, password })
  } catch (error) {
    if (!isStaleJwtSubjectError(error)) throw error
    await dalSignOutRegisterSession({ client })
    return dalSignUpRegisterUser({ client, email, password })
  }
}

export async function ctrlRegisterAccount({
  email,
  password,
  isWandersFlow = false,
}) {
  const nowIso = new Date().toISOString()
  const client = resolveRegisterClient(isWandersFlow)
  const existingSession = await dalReadRegisterSession({ client })
  const existingUserId = existingSession?.user?.id ?? null

  const canUpgradeExistingSession = existingUserId && isAnonymousUser(existingSession?.user)

  if (canUpgradeExistingSession) {
    try {
      await dalUpdateRegisterUser({ client, email, password })

      await dalUpsertRegisterProfile({
        client,
        userId: existingUserId,
        email,
        updatedAt: nowIso,
      })

      await maybeMirrorWandersSession(isWandersFlow, existingUserId)

      return {
        ok: true,
        requiresEmailConfirm: false,
        userId: existingUserId,
        message: null,
      }
    } catch (error) {
      if (!isStaleJwtSubjectError(error)) throw error
      await dalSignOutRegisterSession({ client })
    }
  }

  const authData = await signUpRegisterUserWithRecovery({ isWandersFlow, email, password })
  const newUserId = authData?.user?.id ?? null
  const newSession = authData?.session ?? null

  if (!newUserId || !newSession) {
    return {
      ok: true,
      requiresEmailConfirm: true,
      userId: null,
      message: 'Registration initiated. Please check your email to confirm your account.',
    }
  }

  await dalUpsertRegisterProfile({
    client,
    userId: newUserId,
    email,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await maybeMirrorWandersSession(isWandersFlow, newUserId)

  return {
    ok: true,
    requiresEmailConfirm: false,
    userId: newUserId,
    message: null,
  }
}
