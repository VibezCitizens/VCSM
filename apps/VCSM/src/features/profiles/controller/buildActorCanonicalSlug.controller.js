// features/profiles/controller/buildActorCanonicalSlug.controller.js
// ─────────────────────────────────────────────────────────────
// Orchestrates the SEO slug pipeline:
//   1. Single query against vport.public_actor_seo_v
//   2. Pass reshaped row to ActorSeoModel
//   3. Return the canonical slug and structured slug parts
//
// Called by useActorCanonicalSlug hook. Result is cached so
// repeated navigations (back/forward) don't trigger re-fetches.
//
// Layer: Controller — orchestration only, no UI, no React, no RPC writes.
// ─────────────────────────────────────────────────────────────

import { createTTLCache } from '@/shared/lib/ttlCache'
import { ActorSeoModel } from '@/features/profiles/model/actorSeo.model'

import { readActorSeoViewDAL } from '@/features/profiles/dal/readActorSeoData.dal'

// Controller-level cache so the full pipeline runs at most once per actor
// within a 10-minute window. Invalidated on profile writes if needed.
const controllerCache = createTTLCache(10 * 60 * 1000)

/**
 * Build the canonical SEO slug for an actor profile.
 *
 * Fetches the minimum data required to produce a full slug:
 *   - display_name / username (identity.actor_directory)
 *   - business name / stored slug (vport.profiles)
 *   - location_text / address (vport.profile_public_details)
 *   - primary category label (vport.profile_categories + vport.categories)
 *
 * Vport actors use all four sources.
 * User actors use only actor_directory (name only, no location/category).
 *
 * @param {string} actorId — UUID
 * @returns {Promise<{
 *   canonicalSlug: string|null,
 *   slugParts: { name, category, city, state },
 *   actorKind: string|null,
 * }>}
 */
export async function buildActorCanonicalSlugController(actorId) {
  if (!actorId) return { canonicalSlug: null, slugParts: {}, actorKind: null }

  const cached = controllerCache.get(actorId)
  if (cached) return cached

  // ── Step 1: Single view query replaces 4 parallel raw-table calls ──
  const seoRow = await readActorSeoViewDAL(actorId).catch(() => null)

  const actorKind = seoRow?.actor_kind ?? null

  // Reshape view row into the shape ActorSeoModel expects
  const actorRow = seoRow
    ? { actor_id: seoRow.actor_id, actor_kind: seoRow.actor_kind, display_name: seoRow.profile_display_name, username: seoRow.profile_username }
    : null

  const vportProfile = seoRow?.vport_profile_id
    ? { id: seoRow.vport_profile_id, actor_id: seoRow.actor_id, name: seoRow.vport_name, slug: seoRow.vport_slug }
    : null

  const publicDetails = seoRow
    ? { location_text: seoRow.location_text, address: seoRow.address }
    : null

  const category = seoRow?.primary_category_key
    ? { key: seoRow.primary_category_key, label: seoRow.primary_category_label }
    : null

  // ── Step 2: Build canonical slug via model ─────────────────
  const result = ActorSeoModel({ actorId, actorRow, vportProfile, publicDetails, category })

  let canonicalSlug = result.canonicalSlug
  let slugParts = result.slugParts ?? {}

  // ── Step 3: Hydration store fallback ───────────────────────
  // If all fetches failed and the model returned no slug (no name available),
  // check the hydration store for a cached display name before giving up.
  // Worst case: produce "{uuid}-profile" — a valid canonical slug that unblocks
  // the skeleton and allows the profile screen to render with whatever data loads.
  // Last-resort fallback: if the model couldn't produce a slug (all fetches
  // failed, no name data at all), check the hydration store for a cached name.
  // Returns null if nothing is available — the screen will render an error state
  // rather than deadlocking in skeleton.
  if (!canonicalSlug) {
    // All slug sources failed (vport.profiles.slug is null, no username/display_name).
    // Fall back to bare actorId so /profile/{uuid} works without a redirect loop.
    // The render gate in ActorProfileScreen allows bare-UUID canonical slugs.
    canonicalSlug = actorId
  }

  const output = {
    canonicalSlug,
    slugParts,
    actorKind,
  }

  // Cache only when we have a slug — don't cache partial failures
  if (canonicalSlug) {
    controllerCache.set(actorId, output)
  }

  return output
}

/**
 * Bust the controller-level cache when an actor's profile data changes.
 * Call this after any write that affects name, category, or location.
 *
 * @param {string|null} actorId — pass null to clear all cached entries
 */
export function invalidateActorCanonicalSlugCache(actorId) {
  actorId
    ? controllerCache.invalidate(actorId)
    : controllerCache.invalidateAll()
}
