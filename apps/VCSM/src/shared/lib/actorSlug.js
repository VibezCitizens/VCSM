/**
 * actorSlug.js — Actor profile URL slug utility
 *
 * Canonical slug format (UUID-free):
 *   Vport actors: vport.profiles.slug         e.g. "tyba-restaurant"
 *   User actors:  public.profiles.username     e.g. "architect"
 *
 * Legacy format (backward compat, auto-redirected):
 *   {uuid}-{name}[-{category}][-{city}-{state}]
 *   e.g. "5c2c5402-...-marias-restaurant-laredo-tx"
 *
 * Rules:
 *  - Canonical slugs never contain a UUID prefix
 *  - UUID-prefixed or bare-UUID params are legacy → redirect to canonical
 *  - buildActorSlug is kept for internal use but no longer used for routing
 *
 * Pure utility — no imports, no side effects, no Supabase.
 */

const MAX_SLUG_LENGTH = 80

// Strict UUID v4 pattern — 8-4-4-4-12 hex segments
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ─────────────────────────────────────────────────────────────
// Primitive
// ─────────────────────────────────────────────────────────────

/**
 * Normalize a single text segment for inclusion in a URL slug.
 *
 * - Lowercase
 * - Strip accents (NFD decompose → strip combining marks)
 * - Remove anything that isn't a-z, 0-9, space, or hyphen
 * - Collapse whitespace / underscores → single hyphen
 * - Strip leading / trailing hyphens
 *
 * @param {string} text
 * @returns {string} — normalized segment, or "" if nothing useful remains
 */
export function normalizeSlugPart(text) {
  if (!text || typeof text !== 'string') return ''

  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')                    // decompose accented chars (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // strip combining diacritical marks
    .replace(/[^a-z0-9\s_-]/g, '')      // remove anything else
    .replace(/[\s_]+/g, '-')            // spaces / underscores → hyphen
    .replace(/-+/g, '-')                // collapse consecutive hyphens
    .replace(/^-|-$/g, '')              // trim leading / trailing hyphens
}

// ─────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────

/**
 * Build the canonical SEO slug for an actor profile route param.
 *
 * The actorId is always the first segment so it can always be
 * safely extracted later with extractActorIdFromSlug().
 *
 * @param {string} actorId — UUID (required)
 * @param {Object} [parts]
 * @param {string} [parts.name]     — display name or business name
 * @param {string} [parts.category] — primary category (e.g. "locksmith", "barber")
 * @param {string} [parts.city]     — city name
 * @param {string} [parts.state]    — state abbreviation (e.g. "TX")
 * @returns {string} — full slug param safe to use in /profile/:actorId
 */
export function buildActorSlug(actorId, { name, category, city, state } = {}) {
  if (!actorId || typeof actorId !== 'string') return actorId ?? ''

  const parts = [actorId]

  const namePart = normalizeSlugPart(name)
  if (namePart) parts.push(namePart)

  const categoryPart = normalizeSlugPart(category)
  if (categoryPart) parts.push(categoryPart)

  const cityPart = normalizeSlugPart(city)
  if (cityPart) parts.push(cityPart)

  const statePart = normalizeSlugPart(state)
  if (statePart) parts.push(statePart)

  const full = parts.join('-')
  if (full.length <= MAX_SLUG_LENGTH) return full

  // Over length — trim the readable suffix, never the UUID.
  // Cut at the last hyphen boundary before the limit.
  const trimmed = full.slice(0, MAX_SLUG_LENGTH)
  const lastHyphen = trimmed.lastIndexOf('-')

  // If the last hyphen is inside the UUID (first 36 chars), just return the UUID.
  return lastHyphen > 36 ? trimmed.slice(0, lastHyphen) : actorId
}

// ─────────────────────────────────────────────────────────────
// Extract
// ─────────────────────────────────────────────────────────────

/**
 * Extract the actor UUID from a slug param.
 *
 * Handles three cases:
 *  1. Bare UUID          → "550e8400-e29b-41d4-a716-446655440000"
 *  2. Full slug          → "550e8400-e29b-41d4-a716-446655440000-johns-locksmith-tx"
 *  3. Username / garbage → returns null (caller treats as username route)
 *
 * @param {string} slugParam — raw value of :actorId from useParams()
 * @returns {string|null} — UUID string or null
 */
export function extractActorIdFromSlug(slugParam) {
  if (!slugParam || typeof slugParam !== 'string') return null

  // Case 1: param IS a plain UUID
  if (UUID_RE.test(slugParam)) return slugParam

  // Case 2: slug starts with UUID followed by '-{readable suffix}'
  // UUID is always exactly 36 chars; char at index 36 must be '-'
  if (slugParam.length > 36 && slugParam[36] === '-') {
    const candidate = slugParam.slice(0, 36)
    if (UUID_RE.test(candidate)) return candidate
  }

  // Case 3: not a UUID-based param (username, legacy handle, etc.)
  return null
}

/**
 * Returns true when the route param is a canonical UUID-free slug.
 *
 * Canonical means:
 *  - Non-empty string
 *  - Does NOT start with a UUID (bare or prefixed) — those are legacy
 *  - Contains only lowercase letters, digits, and hyphens
 *  - Does not start or end with a hyphen
 *
 * @param {string} slugParam
 * @returns {boolean}
 */
export function isCanonicalSlug(slugParam) {
  if (!slugParam || typeof slugParam !== 'string') return false
  const s = slugParam.trim()
  if (s.length === 0) return false
  // Bare UUID — legacy, not canonical
  if (UUID_RE.test(s)) return false
  // UUID-prefixed slug — legacy format, not canonical
  if (s.length > 36 && UUID_RE.test(s.slice(0, 36)) && s[36] === '-') return false
  // Must be a clean lowercase slug
  return /^[a-z0-9][a-z0-9-]*$/.test(s)
}

// ─────────────────────────────────────────────────────────────
// Location parsing
// ─────────────────────────────────────────────────────────────

/**
 * Parse city and state abbreviation from a location_text string or
 * a structured address object (from vport.profile_public_details).
 *
 * Supported location_text formats:
 *   "Laredo, TX"          → { city: "Laredo", state: "TX" }
 *   "Laredo, TX 78040"    → { city: "Laredo", state: "TX" }
 *   "Laredo, Texas"       → { city: "Laredo", state: "Texas" }
 *   "Laredo"              → { city: "Laredo", state: null }
 *
 * @param {string|null}  locationText — free-text location string
 * @param {Object|null}  addressObj   — jsonb address object (optional)
 * @returns {{ city: string|null, state: string|null }}
 */
export function parseCityState(locationText, addressObj = null) {
  // Prefer structured address when available — more reliable than parsing text
  if (addressObj && typeof addressObj === 'object') {
    const city =
      addressObj.city ||
      addressObj.locality ||
      addressObj.town ||
      null

    const state =
      addressObj.state ||
      addressObj.state_code ||
      addressObj.region ||
      addressObj.province ||
      null

    if (city || state) {
      return { city: city || null, state: state || null }
    }
  }

  // Fall back to parsing location_text
  if (!locationText || typeof locationText !== 'string') {
    return { city: null, state: null }
  }

  const trimmed = locationText.trim()
  if (!trimmed) return { city: null, state: null }

  const commaIdx = trimmed.indexOf(',')

  // No comma → treat whole string as city
  if (commaIdx === -1) {
    return { city: trimmed || null, state: null }
  }

  const city = trimmed.slice(0, commaIdx).trim() || null
  // After comma: "TX", "TX 78040", "Texas", "Texas, USA"
  const rest = trimmed.slice(commaIdx + 1).trim()
  // Take first word only — avoids zip codes and country names leaking in
  const state = rest ? rest.split(/[\s,]+/)[0] : null

  return { city: city || null, state: state || null }
}

// ─────────────────────────────────────────────────────────────
// Stored slug validation
// ─────────────────────────────────────────────────────────────

/**
 * Validate a stored slug value (e.g., vport.profiles.slug) before
 * trusting it as the name part of the canonical URL.
 *
 * Rejects:
 *  - null / empty
 *  - too short (< 2 chars) or too long (> 80 chars)
 *  - contains uppercase or invalid characters
 *  - starts or ends with a hyphen
 *
 * @param {string} slug
 * @returns {boolean}
 */
export function validateStoredSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  const s = slug.trim()
  if (s.length < 2 || s.length > 80) return false
  // Must be lowercase, alphanumeric + hyphens only, no leading/trailing hyphen
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s)
}

// ─────────────────────────────────────────────────────────────
// Slug deduplication
// ─────────────────────────────────────────────────────────────

/**
 * Remove consecutively repeated words from a hyphen-joined slug.
 * Prevents outputs like "locksmith-locksmith-laredo" when the
 * business name and category both contain the same word.
 *
 * Only removes CONSECUTIVE duplicates — preserves intentional repeats
 * in different positions.
 *
 * @param {string} slug
 * @returns {string}
 */
export function dedupeSlugWords(slug) {
  if (!slug || typeof slug !== 'string') return slug ?? ''

  const words = slug.split('-')
  const result = []

  for (const word of words) {
    if (!word) continue
    // Only skip if this word immediately follows itself
    if (result.length > 0 && result[result.length - 1] === word) continue
    result.push(word)
  }

  return result.join('-')
}
