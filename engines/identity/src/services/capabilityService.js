// src/services/capabilityService.js
// ============================================================
// Identity Engine — Capability Service
// ------------------------------------------------------------
// Computes the final effective capability set for an account.
//
// Resolution order:
//   1. Collect capabilities granted via roles (role_capabilities)
//   2. Apply direct user_capabilities overrides:
//      - status: 'granted'  → adds to set (even if not in a role)
//      - status: 'revoked'  → removes from set
//      - status: 'pending'  → ignored
// ============================================================

import { dalGetRoleIdsForAccount, dalGetCapabilityKeysByRoleIds } from '../dal/roles.read.dal.js'
import { dalGetDirectCapabilitiesForAccount } from '../dal/capabilities.read.dal.js'

/**
 * Resolve the effective capability key set for an app account.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<string[]>}
 */
export async function resolveCapabilityKeys({ userAppAccountId }) {
  const [roleIds, directOverrides] = await Promise.all([
    dalGetRoleIdsForAccount({ userAppAccountId }),
    dalGetDirectCapabilitiesForAccount({ userAppAccountId }),
  ])

  const roleCapabilityKeys = await dalGetCapabilityKeysByRoleIds({ roleIds })

  // Start with role-granted capabilities
  const effectiveSet = new Set(roleCapabilityKeys)

  // Apply direct overrides
  for (const { key, status } of directOverrides) {
    if (status === 'granted') effectiveSet.add(key)
    if (status === 'revoked') effectiveSet.delete(key)
  }

  return Array.from(effectiveSet)
}
