// features/profiles/controller/buildActorCanonicalSlug.controller.js
// ─────────────────────────────────────────────────────────────
// Orchestrates the SEO slug pipeline:
//   1. Fetch actor + vport data in parallel (4 DAL calls)
//   2. Pass raw rows to ActorSeoModel
//   3. Return the canonical slug and structured slug parts
//
// Called by useActorCanonicalSlug hook. Result is cached so
// repeated navigations (back/forward) don't trigger re-fetches.
//
// Layer: Controller — orchestration only, no UI, no React, no RPC writes.
// ─────────────────────────────────────────────────────────────

import { createTTLCache } from '@/shared/lib/ttlCache'
import { ActorSeoModel } from '@/features/profiles/model/ActorSeoModel'

import {
  readActorDirectoryRowDAL,
  readVportProfileByActorDAL,
  readVportPublicDetailsForSeoDAL,
  readVportPrimaryCategoryDAL,
} from '@/features/profiles/dal/readActorSeoData.dal'

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

  // ── Step 1: Fetch actor directory + vport profile in parallel ──
  // actor_directory row is always present for both user and vport actors.
  // vport profile row is null for user actors — that's fine, model handles it.
  const [actorRow, vportProfile] = await Promise.all([
    readActorDirectoryRowDAL(actorId).catch(() => null),
    readVportProfileByActorDAL(actorId).catch(() => null),
  ])

  const actorKind = actorRow?.actor_kind ?? null
  // If actor_directory failed but vport.profiles returned a row, the actor is
  // definitely a vport — still fetch location + category for a full slug.
  const isVport = actorKind === 'vport' || (actorKind === null && vportProfile !== null)

  // ── Step 2: Fetch location + category (vport only, parallel) ──
  // Skip these fetches for user actors to avoid unnecessary queries.
  const vportProfileId = vportProfile?.id ?? null

  const [publicDetails, category] = isVport
    ? await Promise.all([
        readVportPublicDetailsForSeoDAL(vportProfileId).catch(() => null),
        readVportPrimaryCategoryDAL(vportProfileId).catch(() => null),
      ])
    : [null, null]

  // ── Step 3: Build canonical slug via model ─────────────────
  // Pass actorId explicitly so the model never derives null from failed fetches.
  const result = ActorSeoModel({ actorId, actorRow, vportProfile, publicDetails, category })

  let canonicalSlug = result.canonicalSlug
  let slugParts = result.slugParts ?? {}

  // ── Step 4: Hydration store fallback ───────────────────────
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
