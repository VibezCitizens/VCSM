import {
  dalExchangeRecoveryCode,
  dalSignOutRecoverySession,
  dalSubscribeToAuthStateChange,
} from '@/features/auth/password-recovery/dal/resetPassword.dal'
import { dalGetAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'
import { dalUpdatePasswordSecure } from '@/features/auth/password-recovery/dal/resetPasswordSecure.dal'
import { evaluateRegisterPasswordRules } from '@/features/auth/shared/model/passwordRules.model'
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'

// ─── Recovery permit ─────────────────────────────────────────────────────────
// TICKET-AUTH-RESET-SECURITY-001
//
// Key must stay in sync with RECOVERY_FLAG_KEY in AuthProvider.jsx.
//
// AuthProvider writes { permitId: <uuid>, issuedAt: <ms> } to this sessionStorage
// key ONLY after auth-register-recovery (Edge Function) validates the session and
// issues a server-side permit row in platform.auth_recovery_permits.
//
// SECURITY MODEL — two layers:
//
//   Client layer (this file):
//     readRecoveryPermit() validates the sessionStorage entry is structurally
//     well-formed and within its local TTL. This gates the form UI — prevents
//     the password form from rendering without a permit in storage.
//     ⚠ sessionStorage is still user-writable. A source-aware user can insert
//     a UUID-shaped value. This layer is UX defense, not a security boundary.
//
//   Server layer (auth-reset-password-secure Edge Function):
//     The Edge Function validates the permitId against the DB:
//       - permit row must exist for the caller's verified user_id
//       - permit must be unused (used_at IS NULL)
//       - permit must not be expired (expires_at > now)
//     This is the authoritative security boundary.
//     A forged permitId that does not exist in platform.auth_recovery_permits
//     for the caller's user_id is rejected with 403.
//
// AMR note (unchanged from prior implementation):
//   Supabase auth-js v2.50.0 does NOT include method:'recovery' in the JWT AMR
//   for password-reset sessions. Recovery sessions use method:'otp', which is
//   indistinguishable from OTP/magic-link flows at the JWT claim level.
//   AMR-based discrimination is therefore unreliable and not used.
//
// TTL: 15 minutes — client-side window for completing the password form.
// The server permit TTL (10 minutes) is the authoritative expiry.
const RECOVERY_PERMIT_KEY = 'vc.auth.recovery'
const RECOVERY_PERMIT_TTL_MS = 15 * 60 * 1000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Reads and validates the recovery permit entry from sessionStorage.
 * Returns the parsed object { permitId, issuedAt } if valid, otherwise null.
 * Automatically removes the entry if it has expired.
 */
function readRecoveryPermit() {
  try {
    const raw = sessionStorage.getItem(RECOVERY_PERMIT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.permitId !== 'string' ||
      !UUID_RE.test(parsed.permitId) ||
      typeof parsed?.issuedAt !== 'number'
    ) {
      return null // malformed — reject silently
    }
    if (Date.now() - parsed.issuedAt > RECOVERY_PERMIT_TTL_MS) {
      sessionStorage.removeItem(RECOVERY_PERMIT_KEY) // expired — clean up
      return null
    }
    return parsed
  } catch (_) {
    return null
  }
}

export function clearRecoveryFlag() {
  try { sessionStorage.removeItem(RECOVERY_PERMIT_KEY) } catch (_) {}
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
      error: 'Reset link is invalid or has expired. Please request a new one.',
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
  // Required: a valid recovery permit must be present in sessionStorage.
  // The permit is a UUID written by AuthProvider only after auth-register-recovery
  // (Edge Function) validates the session and inserts a row in
  // platform.auth_recovery_permits. The DB row is the authoritative security
  // boundary — the sessionStorage value is a UX hint only (see module header).
  //
  // Returning { ok: false, error: null } keeps Path A open: useSetNewPassword
  // will wait for watchPasswordRecoveryController rather than resolving to error.
  // ────────────────────────────────────────────────────────────────────────────
  if (!readRecoveryPermit()) {
    return { ok: false, session: null, error: null }
  }

  // Permit is present and within TTL. Fetch the live session to confirm one exists.
  // This path handles hash tokens and already-consumed PKCE codes (e.g., page refresh);
  // the permit in sessionStorage survives the refresh and re-validates the UX gate.
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
 * Updates the authenticated user's password via the auth-reset-password-secure
 * Edge Function, then signs out the recovery session.
 *
 * TICKET-AUTH-RESET-SECURITY-001: direct supabase.auth.updateUser({ password })
 * is no longer used here. The Edge Function validates the server-side recovery
 * permit before delegating to admin.updateUserById — closing the sessionStorage
 * forgery bypass.
 */
export async function updatePasswordController({ password }) {
  if (!password) throw new Error('Password is required.')
  const { allValid } = evaluateRegisterPasswordRules(password)
  if (!allValid) throw new Error('Password does not meet the required rules.')

  const permit = readRecoveryPermit()
  if (!permit) throw new Error('No valid recovery permit. Please request a new reset link.')

  try {
    await dalUpdatePasswordSecure({ permitId: permit.permitId, password })
  } catch (error) {
    captureVcsmError({
      feature: 'auth',
      module: 'setNewPassword.controller',
      severity: 'error',
      message: `updatePasswordController: dalUpdatePasswordSecure failed — ${error?.message ?? 'unknown'}`,
      error_name: error?.name,
      operation: 'dalUpdatePasswordSecure',
      is_handled: false,
    })
    throw error
  }

  // Sign out the recovery session so the user must log in fresh.
  // Non-fatal: session expires naturally if sign-out fails transiently.
  try {
    await dalSignOutRecoverySession()
  } catch {
    // intentionally swallowed
  }
}
