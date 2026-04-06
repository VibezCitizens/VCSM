// src/services/destinationService.js
// ============================================================
// Identity Engine — Destination Service
// Resolves where to send the user after login.
//
// Priority:
//   1. state.default_destination_key  (admin-defined or app-set)
//   2. state.last_destination_key     (resume where user left off)
//   3. null                           (app decides fallback)
// ============================================================

/**
 * @param {import('../types/index.js').DomainState|null} state
 * @returns {string|null}
 */
export function resolveDefaultDestination(state) {
  if (!state) return null
  return state.defaultDestinationKey ?? state.lastDestinationKey ?? null
}
