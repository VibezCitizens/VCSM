import {
  dalExchangeCodeForSession,
  dalGetCurrentSession,
} from '@/features/auth/dal/authCallback.dal'

function parseCallbackParams() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return {
    code: search.get('code'),
    error: search.get('error') || hash.get('error'),
    errorDescription: search.get('error_description') || hash.get('error_description'),
    // 'recovery' for password reset hash tokens, 'signup' for email confirmation
    hashType: hash.get('type'),
  }
}

/**
 * Resolves the auth state from a Supabase email verification redirect.
 *
 * Handles two redirect modes:
 *   - PKCE (code param): explicitly exchanges the code for a session
 *   - Implicit (hash tokens): detectSessionInUrl handles these; getSession() returns the result
 *
 * Returns { ok, session, isRecovery, error }
 * isRecovery: true when this is a password reset flow — caller must redirect to /reset-password
 */
export async function resolveAuthCallbackController() {
  const { code, error, errorDescription, hashType } = parseCallbackParams()

  if (error) {
    return {
      ok: false,
      session: null,
      isRecovery: false,
      error: errorDescription || 'Verification failed.',
    }
  }

  // Hash-based recovery tokens (implicit flow): type=recovery in hash.
  // Do not exchange here — let ResetPasswordScreen handle the recovery session.
  if (hashType === 'recovery') {
    return { ok: true, session: null, isRecovery: true, error: null }
  }

  if (code) {
    try {
      const session = await dalExchangeCodeForSession(code)
      if (!session) {
        return {
          ok: false,
          session: null,
          isRecovery: false,
          error: 'Verification link expired or already used. Please log in.',
        }
      }
      return { ok: true, session, isRecovery: false, error: null }
    } catch {
      return {
        ok: false,
        session: null,
        isRecovery: false,
        error: 'Verification failed. The link may have expired.',
      }
    }
  }

  // Hash-based tokens: detectSessionInUrl processes these during client init.
  // getSession() awaits that exchange and returns the resulting session.
  const session = await dalGetCurrentSession()
  if (!session) {
    return { ok: false, session: null, isRecovery: false, error: null }
  }
  return { ok: true, session, isRecovery: false, error: null }
}
