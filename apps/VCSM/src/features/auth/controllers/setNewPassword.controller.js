import {
  dalExchangeRecoveryCode,
  dalSignOutRecoverySession,
  dalSubscribeToAuthStateChange,
  dalUpdateUserPassword,
} from '@/features/auth/dal/resetPassword.dal'
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'
import { evaluateRegisterPasswordRules } from '@/features/auth/model/registerPasswordRules.model'

// ─── Recovery nonce ──────────────────────────────────────────────────────────
// Key must stay in sync with RECOVERY_FLAG_KEY in AuthProvider.jsx.
//
// AuthProvider writes a JSON object { nonce: <uuid>, issuedAt: <ms> } to this
// sessionStorage key ONLY when Supabase emits PASSWORD_RECOVERY, which itself
// requires a genuine server-issued recovery code or token exchange.
//
// Why nonce instead of '1':
//   A plain boolean flag is trivially forged via sessionStorage.setItem('…','1').
//   A UUID nonce requires knowing both the key name AND the JSON schema. This raises
//   the barrier from "one keystroke" to "requires reading the source code".
//
// Why not AMR claims (BW-LOGIN-001 re-audit finding):
//   Supabase auth-js v2.50.0 does NOT include method:'recovery' in the JWT AMR for
//   password-reset sessions. The AMRMethods enum is:
//   ["password","otp","oauth","totp","mfa/totp","mfa/phone","mfa/webauthn",
//    "anonymous","sso/saml","magiclink","web3","oauth_provider/authorization_code"]
//   Recovery sessions use method:'otp' or method:'email', which are indistinguishable
//   from other OTP/email flows at the JWT claim level. AMR-based detection is therefore
//   unreliable and was not implemented.
//
// ⚠ CLIENT-SIDE MITIGATION ONLY — NO SERVER-SIDE RECOVERY PROVENANCE CHECK:
//   sessionStorage is accessible to any JavaScript on the page. A user who reads
//   this source can set a valid JSON nonce manually and pass this gate.
//
//   IMPORTANT (VENOM-AUTH-001): supabase.auth.updateUser({ password }) requires a
//   valid authenticated JWT but does NOT enforce that the session originated from a
//   PASSWORD_RECOVERY event. There is no server-side recovery-provenance check on
//   the Supabase updateUser endpoint. A source-code-aware user who holds any valid
//   authenticated session and sets a structurally conforming nonce CAN reach and
//   successfully submit the password update form. Impact is self-exploitation only —
//   no cross-user path exists. Full provenance closure requires a server-side Edge
//   Function that validates recovery session origin before forwarding to updateUser.
//
//   This control prevents accidental and casual access, not determined technical bypass.
//
// TTL: 30 minutes — reasonable window for completing a password reset.
const RECOVERY_NONCE_KEY = 'vc.auth.recovery'
const RECOVERY_NONCE_TTL_MS = 30 * 60 * 1000

/**
 * Reads and validates the recovery nonce from sessionStorage.
 * Returns the parsed nonce object if present and within TTL, otherwise null.
 * Automatically removes the entry if it has expired.
 */
function readRecoveryNonce() {
  try {
    const raw = sessionStorage.getItem(RECOVERY_NONCE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.nonce !== 'string' || typeof parsed?.issuedAt !== 'number') {
      return null // malformed — reject silently
    }
    if (Date.now() - parsed.issuedAt > RECOVERY_NONCE_TTL_MS) {
      sessionStorage.removeItem(RECOVERY_NONCE_KEY) // expired — clean up
      return null
    }
    return parsed
  } catch (_) {
    return null
  }
}

export function clearRecoveryFlag() {
  try { sessionStorage.removeItem(RECOVERY_NONCE_KEY) } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

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
    return {
      ok: false,
      session: null,
      // BW-LOGIN-003: errorDescription is attacker-controllable via URL params — guard in
      // production. DEV preserves the debug text; production returns a fixed message.
      error: import.meta.env.DEV
        ? (errorDescription || 'Reset link is invalid.')
        : 'Reset link is invalid or has expired. Please request a new one.',
    }
  }

  if (code) {
    // A successful code exchange is itself proof of a legitimate recovery flow —
    // the code is single-use and issued by Supabase. No flag check required here.
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

  // ── Fallback gate (no code in URL) ──────────────────────────────────────────
  // Required: a valid recovery nonce must be present in sessionStorage and within
  // its 30-minute TTL. The nonce is a random UUID written exclusively by AuthProvider
  // when Supabase emits PASSWORD_RECOVERY — an event that itself requires a genuine
  // server-issued recovery token.
  //
  // A simple '1' flag is trivially forged. A random UUID nonce raises the barrier:
  // a user who wants to bypass must know the key name AND produce valid JSON.
  // See the module-header caveat for the full limitation statement.
  //
  // Returning { ok: false, error: null } (no error text) keeps Path A open:
  // useSetNewPassword will wait for watchPasswordRecoveryController rather than
  // immediately resolving to the error state.
  // ────────────────────────────────────────────────────────────────────────────
  if (!readRecoveryNonce()) {
    return { ok: false, session: null, error: null }
  }

  // Nonce is present and within TTL. Fetch the live session to confirm one exists.
  // This path handles hash tokens and already-consumed PKCE codes (e.g., page refresh);
  // the nonce in sessionStorage survives the refresh and re-validates intent.
  const session = await dalGetAuthSession()
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
  // Non-fatal: session will expire naturally if sign-out fails transiently.
  try {
    await dalSignOutRecoverySession()
  } catch {
    // intentionally swallowed
  }
}
