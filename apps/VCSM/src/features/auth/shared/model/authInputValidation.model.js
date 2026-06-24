// TICKET-AUTH-INPUT-VALIDATION-001: centralized auth input guards.
// Single source of truth for email normalization, redirect whitelisting,
// invite_code format validation, and safe login error mapping.

const MAX_EMAIL_LENGTH = 254

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INVITE_CODE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// FINDING-001: whitelist replaces blacklist for post-auth return paths.
// Only paths under these prefixes are accepted as redirect destinations.
const SAFE_RETURN_PREFIXES = [
  '/feed',
  '/CentralFeed',
  '/explore',
  '/profile',
  '/vport',
  '/dashboard',
  '/settings',
  '/booking',
  '/learning',
  // TICKET-TRAZE-CLAIM-VPORT-003 (T3): the Traze claim funnel preserves
  // provider/source through register+onboarding+login by round-tripping the
  // /claim-profile path via location.state.from.
  '/claim-profile',
]

// FINDING-008: only these messages are surfaced verbatim in login error UI.
// Supabase internals, stack traces, and unexpected messages map to the generic fallback.
const SAFE_LOGIN_ERROR_MESSAGES = new Set([
  'Invalid login credentials',
  'Email not confirmed',
  'Email is required.',
  'Email address is too long.',
  'Please enter a valid email address.',
  'Login request timed out. Please try again.',
])

// Returns a trimmed, lowercased email string. Does not throw.
export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isValidEmailFormat(value) {
  return EMAIL_FORMAT_REGEX.test(String(value ?? '').trim())
}

// Returns the normalized email or throws a user-safe Error.
export function validateEmail(value) {
  const normalized = normalizeEmail(value)
  if (!normalized) throw new Error('Email is required.')
  if (normalized.length > MAX_EMAIL_LENGTH) throw new Error('Email address is too long.')
  if (!isValidEmailFormat(normalized)) throw new Error('Please enter a valid email address.')
  return normalized
}

// FINDING-001: returns true only when path starts with a known safe in-app prefix.
// Rejects empty values, protocol-relative paths (//), and absolute URLs.
export function isSafeAuthReturnPath(path) {
  if (!path || typeof path !== 'string') return false
  if (path.startsWith('//') || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return false
  return SAFE_RETURN_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(prefix + '/') ||
      path.startsWith(prefix + '?'),
  )
}

// FINDING-002: only UUID-format invite codes are forwarded. Anything else becomes null.
export function isValidInviteCode(value) {
  if (!value || typeof value !== 'string') return false
  return INVITE_CODE_UUID_REGEX.test(value)
}

// FINDING-008: maps raw auth errors to safe user-facing login messages.
// Unexpected Supabase internals collapse to the generic fallback.
export function mapLoginError(err) {
  if (!err) return 'Login failed. Please try again.'
  const message = String(err?.message ?? '')
  return SAFE_LOGIN_ERROR_MESSAGES.has(message) ? message : 'Login failed. Please try again.'
}
