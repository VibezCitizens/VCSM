// engines/hydration/src/hydrate.js
// ============================================================
// Canonical Hydration Controller
// ============================================================
// Single entry point for all actor hydration in any feature.
// Extracts IDs → skips fresh → fetches → normalizes → upserts.
// ============================================================

import { useActorStore } from './store.js'
import { extractActorIdsForHydration } from './extract.js'
import { normalizeActorSummaries } from './normalize.js'
import { getActorSummariesByIdsDAL } from './dal.js'

/**
 * Hydrate actors from rows — the canonical pipeline.
 *
 * 1. Extracts actor IDs from any row shape
 * 2. Skips actors that are fresh in store (unless force=true)
 * 3. Fetches from canonical RPC source
 * 4. Normalizes to canonical shape
 * 5. Upserts into global store with safe merge
 *
 * @param {Array} rows — any array of objects with actor references
 * @param {Object} options
 * @param {boolean} options.force — bypass freshness check, refetch all
 * @returns {Promise<{ hydrated: number, errors: Array }>}
 */
export async function hydrateActorsFromRows(rows, { force = false } = {}) {
  const allIds = extractActorIdsForHydration(rows)
  if (!allIds.length) return { hydrated: 0, errors: [] }

  const store = useActorStore.getState()
  const idsToFetch = force ? allIds : store.getMissingOrStale(allIds)
  if (!idsToFetch.length) return { hydrated: 0, errors: [] }

  const { rows: summaries, error } = await getActorSummariesByIdsDAL({
    actorIds: idsToFetch,
  })

  if (error) {
    if (import.meta.env?.DEV) {
      console.warn('[hydration] fetch failed:', error?.message ?? error)
    }
    return { hydrated: 0, errors: [error] }
  }

  if (!summaries.length) return { hydrated: 0, errors: [] }

  const normalized = normalizeActorSummaries(summaries)
  if (!normalized.length) return { hydrated: 0, errors: [] }

  store.upsertActors(normalized, { force })

  return { hydrated: normalized.length, errors: [] }
}

/**
 * Hydrate actors by explicit IDs.
 * Convenience wrapper when you have IDs directly (not rows).
 *
 * @param {string[]} actorIds
 * @param {Object} options
 * @param {boolean} options.force
 * @returns {Promise<{ hydrated: number, errors: Array }>}
 */
export async function hydrateActorsByIds(actorIds, { force = false } = {}) {
  if (!Array.isArray(actorIds) || !actorIds.length) return { hydrated: 0, errors: [] }

  const rows = actorIds.filter(Boolean).map((id) => ({ actorId: id }))
  return hydrateActorsFromRows(rows, { force })
}

/**
 * Hydrate actors and also return the normalized summaries.
 * Useful for chat DI where the caller also needs the data.
 *
 * @param {string[]} actorIds
 * @returns {Promise<{ rows: Array, error: Error|null }>}
 */
export async function hydrateAndReturnSummaries({ actorIds }) {
  if (!Array.isArray(actorIds) || !actorIds.length) {
    return { rows: [], error: null }
  }

  const { rows: summaries, error } = await getActorSummariesByIdsDAL({ actorIds })

  if (error) {
    if (import.meta.env?.DEV) {
      console.warn('[hydration] fetch failed:', error?.message ?? error)
    }
    return { rows: [], error }
  }

  if (summaries.length) {
    const normalized = normalizeActorSummaries(summaries)
    useActorStore.getState().upsertActors(normalized)
  }

  return { rows: summaries, error: null }
}
