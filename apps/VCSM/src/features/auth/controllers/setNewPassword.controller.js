import {
  dalExchangeRecoveryCode,
  dalGetRecoverySession,
  dalSignOutRecoverySession,
  dalSubscribeToAuthStateChange,
  dalUpdateUserPassword,
} from '@/features/auth/dal/resetPassword.dal'
import { evaluateRegisterPasswordRules } from '@/features/auth/model/registerPasswordRules.model'

function parseRecoveryParams() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return {
    code: search.get('code'),
    error: search.get('error') || hash.get('error'),
    errorDescription: search.get('error_description') || hash.get('error_description'),
  }
}

/**
 * Resolves the recovery session from the URL after a Supabase password-reset redirect.
 *
 * PKCE flow  : exchanges ?code= param (detectSessionInUrl may have already consumed it —
 *              we fall through to getSession() on any exchange failure).
 * Implicit   : detectSessionInUrl processes hash tokens synchronously; getSession() returns result.
 */
export async function resolveRecoverySessionController() {
  const { code, error, errorDescription } = parseRecoveryParams()

  if (error) {
    return { ok: false, session: null, error: errorDescription || 'Reset link is invalid.' }
  }

  if (code) {
    try {
      const session = await dalExchangeRecoveryCode(code)
      if (session) {
        return { ok: true, session }
      }
      // null session — fall through to getSession() below
    } catch {
      // detectSessionInUrl may have consumed the code first — fall through to getSession()
    }
  }

  // Fallback for both hash tokens and already-consumed PKCE codes.
  const session = await dalGetRecoverySession()
  if (!session) {
    return { ok: false, session: null, error: null }
  }
  return { ok: true, session }
}

/**
 * Subscribe to auth state changes and notify the caller on PASSWORD_RECOVERY events.
 * Returns an unsubscribe function — the caller must invoke it on cleanup.
 */
export function watchPasswordRecoveryController(onRecovery) {
  return dalSubscribeToAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') onRecovery(!!session)
  })
}

/**
 * Updates the authenticated user's password and signs out the recovery session.
 * Requires an active recovery session to have been established first.
 */
export async function updatePasswordController({ password }) {
  if (!password) throw new Error('Password is required.')
  const { allValid } = evaluateRegisterPasswordRules(password)
  if (!allValid) throw new Error('Password does not meet the required rules.')
  await dalUpdateUserPassword(password)
  // Sign out the recovery session so the user must log in fresh with their new password.
  await dalSignOutRecoverySession()
}
