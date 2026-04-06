// src/dal/searchActors.dal.js
// ============================================================
// Chat Engine — Actor Search DAL
// ------------------------------------------------------------
// Delegates to the app-injected searchActors function.
// Apps must provide config.searchActors to enable directory search.
// ============================================================

import { getSearchActors } from '../config.js'

/**
 * DAL: searchActors
 * --------------------------------
 * Actor-centric search.
 * Returns RAW actor rows from the app-provided search implementation.
 *
 * The app is responsible for querying its own actor table/view
 * and returning rows with at minimum: { actor_id, display_name }
 * Optional fields: kind, username, photo_url
 */
export async function searchActorsDAL(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const searchActors = getSearchActors()
  if (!searchActors) {
    throw new Error('[ChatEngine] searchActors not configured. Provide config.searchActors to enable directory search.')
  }

  return searchActors(q, limit)
}
