// features/profiles/model/ActorSeoModel.js
// ─────────────────────────────────────────────────────────────
// Pure transform: raw DAL rows → canonical slug parts.
//
// Name resolution priority (first non-empty wins):
//   1. vport.profiles.slug    — already clean and human-readable
//   2. vport.profiles.name    — raw business name
//   3. identity.actor_directory.display_name
//   4. identity.actor_directory.username
//
// Enrichment (appended after name when available):
//   - Primary category label  (e.g., "Restaurant", "Locksmith")
//   - City from location      (e.g., "Laredo")
//   - State abbreviation      (e.g., "TX")
//
// The model does NOT fetch data — it transforms what the controller
// passes in. All slug building happens via the shared utility.
//
// Layer: Model — pure functions, no I/O, no React, no Supabase.
// ─────────────────────────────────────────────────────────────

import {
  normalizeSlugPart,
  validateStoredSlug,
  parseCityState,
} from '@/shared/lib/actorSlug'

/**
 * Build the canonical slug and structured slug parts from raw data rows.
 *
 * @param {Object} params
 * @param {Object|null} params.actorRow      — row from identity.actor_directory
 *                                             { actor_id, actor_kind, display_name, username }
 * @param {Object|null} params.vportProfile  — row from vport.profiles
 *                                             { id, actor_id, name, slug }
 * @param {Object|null} params.publicDetails — row from vport.profile_public_details
 *                                             { location_text, address }
 * @param {Object|null} params.category      — primary category { key, label }
 * @returns {Object} — {
 *   actorId: string|null,
 *   name: string|null,
 *   category: string|null,
 *   city: string|null,
 *   state: string|null,
 *   slugParts: { name, category, city, state },
 *   canonicalSlug: string|null,
 * }
 */
export function ActorSeoModel({ actorId: explicitActorId, actorRow, vportProfile, publicDetails, category } = {}) {
  // Prefer the explicitly-passed actorId so the controller's known UUID is never
  // lost even when both DAL fetches fail (RLS miss, missing row, etc.)
  const actorId = explicitActorId ?? actorRow?.actor_id ?? vportProfile?.actor_id ?? null

  // ── Name ──────────────────────────────────────────────────
  // Priority: stored vport slug → vport name → display_name → username
  let name = null

  if (vportProfile?.slug && validateStoredSlug(vportProfile.slug)) {
    // vport.profiles.slug is already normalized and unique — use it directly
    // as the name segment. It may contain a short random suffix (e.g., "abc12")
    // but it's already human-readable and avoids slug collisions.
    name = vportProfile.slug
  } else if (vportProfile?.name) {
    name = vportProfile.name
  } else if (actorRow?.display_name) {
    name = actorRow.display_name
  } else if (actorRow?.username) {
    name = actorRow.username
  }

  // ── Category ───────────────────────────────────────────────
  // Use the human-readable label (e.g., "Restaurant") not the key ("restaurant")
  // normalizeSlugPart inside buildActorSlug will lowercase it anyway.
  const categoryLabel = category?.label ?? category?.key ?? null

  // ── Location ───────────────────────────────────────────────
  // parseCityState handles both free-text and structured jsonb address.
  const { city, state } = parseCityState(
    publicDetails?.location_text ?? null,
    publicDetails?.address ?? null
  )

  // ── Canonical slug ─────────────────────────────────────────
  if (!actorId) {
    return {
      actorId: null,
      name,
      category: categoryLabel,
      city,
      state,
      slugParts: { name, category: categoryLabel, city, state },
      canonicalSlug: null,
    }
  }

  const slugParts = {
    name,
    category: categoryLabel,
    city,
    state,
  }

  // Canonical slug is UUID-free — use the stored vport slug or username directly.
  // Priority:
  //   1. vport.profiles.slug  — already unique and URL-safe (DB-enforced)
  //   2. actor_directory.username — unique handle for user actors
  //   3. actor_directory.display_name (normalized) — fallback for user actors
  //   4. vport.profiles.name (normalized) — fallback for vports without a slug
  let canonicalSlug = null

  if (vportProfile?.slug && validateStoredSlug(vportProfile.slug)) {
    // Stored slug is already clean and unique — use as-is
    canonicalSlug = vportProfile.slug
  } else if (actorRow?.username) {
    // Username is a clean handle; normalize defensively
    canonicalSlug = normalizeSlugPart(actorRow.username) || null
  } else if (actorRow?.display_name) {
    canonicalSlug = normalizeSlugPart(actorRow.display_name) || null
  }
  // vportProfile.name is NOT used as a canonical slug — it cannot be reverse-looked-up
  // by resolveActorBySlugOrUsernameDAL (only vport.profiles.slug is indexed).
  // Vports without a stored slug fall back to bare actorId in the controller.

  return {
    actorId,
    name,
    category: categoryLabel,
    city,
    state,
    slugParts,
    canonicalSlug,
  }
}

// ─────────────────────────────────────────────────────────────
// Meta helpers (used by useActorSeoMeta)
// ─────────────────────────────────────────────────────────────

/**
 * Build a page <title> string from actor SEO data.
 *
 * @param {Object} params
 * @param {string|null} params.name
 * @param {string|null} params.category
 * @param {string|null} params.city
 * @param {string|null} params.state
 * @param {string}      [params.siteName]
 * @returns {string}
 */
export function buildActorPageTitle({ name, category, city, state, siteName = 'VCSM' }) {
  const parts = [name, category, city && state ? `${city}, ${state}` : city || state]
    .filter(Boolean)

  const descriptor = parts.join(' · ')
  return descriptor ? `${descriptor} | ${siteName}` : siteName
}

/**
 * Build a <meta name="description"> string from actor SEO data.
 *
 * @param {Object} params
 * @param {string|null} params.name
 * @param {string|null} params.bio
 * @param {string|null} params.category
 * @param {string|null} params.city
 * @param {string|null} params.state
 * @param {'user'|'vport'} params.kind
 * @returns {string}
 */
export function buildActorMetaDescription({ name, bio, category, city, state, kind }) {
  if (bio && bio.trim()) {
    const trimmed = bio.trim()
    return trimmed.length > 155
      ? trimmed.slice(0, 152) + '\u2026'
      : trimmed
  }

  const locationStr = city && state
    ? `${city}, ${state}`
    : city || state || null

  if (kind === 'vport') {
    const parts = [name, category, locationStr].filter(Boolean)
    const desc = parts.join(' in ') || name
    return `Book services and connect with ${desc} on VCSM.`
  }

  return `See ${name || 'this profile'}'s posts, friends, and activity on VCSM.`
}
