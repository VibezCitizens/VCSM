// platform/services/actorService.js
// ============================================================
// Actor Service — Platform Service Layer
// ============================================================
// Canonical actor bundle resolution for the entire platform.
//
// Replaces scattered actor/profile/privacy reads across features
// with a single service API backed by the hydration engine store
// and direct bundle fetching when needed.
//
// Consumers: apps/VCSM, apps/wentrex (future), apps/Traffic (future)
// Dependencies: engines/hydration
// ============================================================

import {
  hydrateActorsByIds,
  hydrateAndReturnSummaries,
  useActorStore,
} from '../../engines/hydration/index.js'

/**
 * Get a single actor bundle by ID.
 *
 * Checks hydration store first (5min TTL), fetches if stale/missing.
 * Returns the canonical actor summary shape from the hydration engine.
 *
 * @param {string} actorId
 * @param {Object} [options]
 * @param {boolean} [options.force] — bypass cache, always fetch
 * @returns {Promise<ActorBundle|null>}
 *
 * ActorBundle shape (from hydration engine normalization):
 *   {
 *     id: string,
 *     actor_id: string,
 *     kind: 'user'|'vport'|null,
 *     displayName: string|null,
 *     username: string|null,
 *     photoUrl: string|null,
 *     bannerUrl: string|null,
 *     bio: string|null,
 *     vportName: string|null,
 *     vportSlug: string|null,
 *     vportAvatarUrl: string|null,
 *     vportBannerUrl: string|null,
 *   }
 */
export async function getActorBundle(actorId, { force = false } = {}) {
  if (!actorId) return null

  const store = useActorStore.getState()

  if (!force && !store.isStale(actorId)) {
    return store.getActor(actorId)
  }

  await hydrateActorsByIds([actorId], { force })
  return store.getActor(actorId)
}

/**
 * Get multiple actor bundles by IDs.
 *
 * Batch-aware: only fetches actors that are stale or missing from
 * the hydration store. Cached actors are returned immediately.
 *
 * @param {string[]} actorIds
 * @param {Object} [options]
 * @param {boolean} [options.force] — bypass cache, always fetch all
 * @returns {Promise<ActorBundle[]>}
 */
export async function getActorBundles(actorIds, { force = false } = {}) {
  const ids = (actorIds || []).filter(Boolean)
  if (!ids.length) return []

  await hydrateActorsByIds(ids, { force })

  const store = useActorStore.getState()
  return ids.map((id) => store.getActor(id)).filter(Boolean)
}

/**
 * Get actor bundles as a keyed map { [actorId]: ActorBundle }.
 *
 * Convenience wrapper over getActorBundles for lookup-heavy consumers.
 *
 * @param {string[]} actorIds
 * @param {Object} [options]
 * @param {boolean} [options.force]
 * @returns {Promise<Record<string, ActorBundle>>}
 */
export async function getActorBundleMap(actorIds, { force = false } = {}) {
  const bundles = await getActorBundles(actorIds, { force })
  const map = {}
  for (const b of bundles) {
    if (b?.id) map[b.id] = b
  }
  return map
}

/**
 * Get actor summaries with the raw rows returned (for DI callbacks).
 *
 * Hydrates into the store AND returns the summaries array.
 * Used by engine DI wiring (e.g., chat engine's getActorSummariesByIds).
 *
 * @param {string[]} actorIds
 * @returns {Promise<{ rows: ActorBundle[], error: Error|null }>}
 */
export async function getActorSummaries(actorIds) {
  if (!Array.isArray(actorIds) || !actorIds.length) {
    return { rows: [], error: null }
  }
  return hydrateAndReturnSummaries({ actorIds })
}

/**
 * Read an actor directly from the hydration store (no fetch).
 *
 * Returns null if actor is not in store. Does NOT trigger hydration.
 * Use this for synchronous reads when you know actors are pre-hydrated.
 *
 * @param {string} actorId
 * @returns {ActorBundle|null}
 */
export function getActorFromStore(actorId) {
  if (!actorId) return null
  return useActorStore.getState().getActor(actorId)
}

/**
 * Check if an actor is stale in the hydration store.
 *
 * @param {string} actorId
 * @returns {boolean}
 */
export function isActorStale(actorId) {
  if (!actorId) return true
  return useActorStore.getState().isStale(actorId)
}

/**
 * Invalidate specific actors in the hydration store, forcing
 * next read to refetch.
 *
 * @param {string[]} actorIds
 */
export function invalidateActors(actorIds) {
  if (!actorIds?.length) return

  const store = useActorStore.getState()
  // Force-upsert with stale timestamp to trigger refetch on next read
  const staleRows = actorIds.map((id) => ({
    id,
    _hydratedAt: 0,
  }))
  store.upsertActors(staleRows, { force: true })
}
