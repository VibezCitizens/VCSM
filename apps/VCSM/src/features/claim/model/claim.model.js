// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim funnel model (pure logic, no I/O).
//
// Param parsing, Citizen-actor resolution, RPC error mapping, form options +
// validation, and the auth return-path contract for /claim-profile.

export const CLAIM_PATH = '/claim-profile'

// Public TRAZE directory (apps/Traffic). Used by the global claim landing mode
// to send owners back to search for an existing business listing. Matches
// Traffic's canonical DEFAULT_SITE_ORIGIN (apps/Traffic/src/lib/env.js).
export const TRAZE_DIRECTORY_URL = 'https://traze.vibezcitizens.com/directory'

export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'agency', label: 'Agency / representative' },
]

export const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
]

const VALID_ROLES = new Set(ROLE_OPTIONS.map((r) => r.value))
const VALID_CONTACT = new Set(CONTACT_METHODS.map((c) => c.value))

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Param parsing ───────────────────────────────────────────────────────────

/**
 * Parse the /claim-profile query string. The Traffic CTA sends `provider`
 * (always a slug) plus `source` attribution. We also accept an explicit uuid
 * in `provider` defensively.
 *
 * @param {string} search - location.search (e.g. "?provider=foo&source=traffic")
 * @returns {{ providerSlug: string|null, providerId: string|null, source: string|null }}
 */
export function parseClaimParams(search) {
  const params = new URLSearchParams(search || '')
  const provider = (params.get('provider') || '').trim()
  const source = (params.get('source') || '').trim() || null

  if (!provider) {
    return { providerSlug: null, providerId: null, source }
  }
  if (UUID_REGEX.test(provider)) {
    return { providerSlug: null, providerId: provider, source }
  }
  return { providerSlug: provider, providerId: null, source }
}

/**
 * Rebuild the canonical return path so auth (login/register/onboarding) can
 * round-trip the claimant back to the exact provider/source they started from.
 * Must stay within the SAFE_RETURN_PREFIXES whitelist (/claim-profile).
 */
export function buildClaimReturnPath({ providerSlug, providerId, source }) {
  const params = new URLSearchParams()
  const provider = providerSlug || providerId
  if (provider) params.set('provider', provider)
  if (source) params.set('source', source)
  const qs = params.toString()
  return qs ? `${CLAIM_PATH}?${qs}` : CLAIM_PATH
}

// ── Citizen actor resolution ─────────────────────────────────────────────────

/**
 * Resolve the human's Citizen (kind='user') actor id to attribute the claim to.
 * Prefers the active identity when it is the Citizen; otherwise finds the
 * Citizen among the owned actors. Returns null when none is resolvable yet
 * (e.g. onboarding incomplete) — submission stays gated in that case.
 */
export function resolveCitizenActorId({ identity, availableActors }) {
  if (identity?.kind === 'user' && identity?.actorId) {
    return identity.actorId
  }
  const list = Array.isArray(availableActors) ? availableActors : []
  const citizen = list.find((a) => (a?.actorKind ?? a?.kind) === 'user' && a?.actorId)
  return citizen?.actorId ?? null
}

// ── RPC error mapping ────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  PROVIDER_NOT_FOUND:
    'We could not find that business. The link may be out of date.',
  PROVIDER_ALREADY_CLAIMED:
    'This business has already been claimed. If you believe this is a mistake, contact support.',
  DUPLICATE_PENDING_CLAIM:
    'You already have a claim pending review for this business.',
  ACTOR_NOT_OWNED:
    'We could not verify your Citizen account. Please sign out and back in, then try again.',
  AUTH_REQUIRED_FOR_ACTOR:
    'Please sign in to claim this business.',
  OWNER_NAME_REQUIRED: 'Please enter your name.',
  INVALID_ROLE: 'Please select your role at this business.',
  INVALID_CONTACT_METHOD: 'Please choose a contact method.',
  INVALID_VERIFICATION_METHOD: 'Please choose a valid verification method.',
  EMAIL_REQUIRED: 'Please enter a contact email.',
  PHONE_REQUIRED: 'Please enter a contact phone number.',
}

const KNOWN_CODES = Object.keys(ERROR_MESSAGES)

/**
 * Map a raw RPC error (Postgres exception message) to a stable code + a
 * user-safe message. Unknown errors collapse to a generic fallback so DB
 * internals are never surfaced.
 *
 * @param {unknown} error
 * @returns {{ code: string, message: string }}
 */
export function mapClaimError(error) {
  const raw = String(error?.message ?? error ?? '')
  const code = KNOWN_CODES.find((c) => raw.includes(c)) ?? 'CLAIM_SUBMIT_FAILED'
  const message =
    ERROR_MESSAGES[code] ??
    'Something went wrong submitting your claim. Please try again.'
  return { code, message }
}

// ── Form validation ──────────────────────────────────────────────────────────

export const EMPTY_CLAIM_FORM = Object.freeze({
  ownerName: '',
  role: 'owner',
  contactMethod: 'email',
  email: '',
  phone: '',
  proofImageUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  notes: '',
})

/**
 * Validate the claim form client-side. Mirrors the RPC's required-field guards
 * so the user gets immediate feedback before the round-trip.
 *
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateClaimForm(form) {
  const errors = {}
  if (!form.ownerName || !form.ownerName.trim()) {
    errors.ownerName = 'Please enter your name.'
  }
  if (!VALID_ROLES.has(form.role)) {
    errors.role = 'Please select your role.'
  }
  if (!VALID_CONTACT.has(form.contactMethod)) {
    errors.contactMethod = 'Please choose a contact method.'
  }
  if (form.contactMethod === 'email' && !(form.email && form.email.trim())) {
    errors.email = 'Please enter a contact email.'
  }
  if (form.contactMethod === 'phone' && !(form.phone && form.phone.trim())) {
    errors.phone = 'Please enter a contact phone number.'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
