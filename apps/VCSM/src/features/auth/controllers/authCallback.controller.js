import { dalExchangeCodeForSession } from '@/features/auth/dal/authCallback.dal'
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'

// Accepts an optional URL string so native callers can pass the deep-link URL directly.
// Falls back to window.location.href when running in a browser context.
function parseCallbackParams(url) {
  const resolved = url ?? (typeof window !== 'undefined' ? window.location.href : '')
  const parsed = new URL(resolved, 'http://localhost')
  const search = parsed.searchParams
  const hash = new URLSearchParams(parsed.hash.slice(1))
  return {
    code: search.get('code'),
    error: search.get('error') || hash.get('error'),
    errorDescription: search.get('error_description') || hash.get('error_description'),
    // hash.get('type') is intentionally not returned — it is attacker-controllable via
    // the URL hash and must not be used as a recovery authority (BW-LOGIN-002).
    // Recovery is determined exclusively by Supabase's PASSWORD_RECOVERY auth event
    // handled in AuthProvider, which only fires for real recovery-token sessions.
  }
}

/**
 * Resolves the auth state from a Supabase email verification redirect.
 *
 * Handles two redirect modes:
 *   - PKCE (code param): explicitly exchanges the code for a session
 *   - Implicit (hash tokens): detectSessionInUrl handles these; getSession() returns the result
 *
 * Accepts an optional callbackUrl — native callers pass the deep-link URL; web callers omit it.
 *
 * Returns { ok, session, isRecovery, error }
 * isRecovery: always false — password reset flows are handled exclusively by
 * AuthProvider's PASSWORD_RECOVERY event handler, not by this callback.
 */
export async function resolveAuthCallbackController(callbackUrl) {
  const { code, error, errorDescription } = parseCallbackParams(callbackUrl)

  if (error) {
    return {
      ok: false,
      session: null,
      isRecovery: false,
      // Fixed message in production — error_description is attacker-controllable via URL params
      error: import.meta.env.DEV
        ? (errorDescription || 'Verification failed.')
        : 'Verification failed. Please try again or request a new link.',
    }
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
  const session = await dalGetAuthSession()
  if (!session) {
    return { ok: false, session: null, isRecovery: false, error: null }
  }
  return { ok: true, session, isRecovery: false, error: null }
}
