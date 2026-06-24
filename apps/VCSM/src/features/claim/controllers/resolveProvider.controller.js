// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — provider resolution controller.
// Wraps the read DAL so the hook never imports the DAL directly.

import { fetchClaimableProvider } from '@/features/claim/dal/providerLookup.read.dal'

/**
 * Best-effort resolve of the provider being claimed, for display only.
 * @param {{ id?: string|null, slug?: string|null }} params
 * @returns {Promise<object|null>}
 */
export async function resolveProviderController({ id = null, slug = null } = {}) {
  return fetchClaimableProvider({ id, slug })
}
