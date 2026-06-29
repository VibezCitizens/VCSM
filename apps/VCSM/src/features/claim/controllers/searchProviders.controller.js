// TICKET-TRAZE-CLAIM-LANDING-001 — provider search controller.
// Wraps the read DAL so hooks never import the DAL directly.

import { searchClaimableProviders } from '@/features/claim/dal/searchProviders.read.dal'

/**
 * Search claimable providers by display name for the claim landing.
 * @param {{ query?: string, limit?: number }} params
 * @returns {Promise<object[]>}
 */
export async function searchProvidersController({ query = '', limit } = {}) {
  return searchClaimableProviders({ query, limit })
}
