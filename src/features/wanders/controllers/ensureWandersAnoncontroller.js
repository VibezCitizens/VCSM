// src/features/wanders/controllers/ensureWandersAnon.controller.js
// ============================================================================
// WANDERS CONTROLLER — ENSURE ANON IDENTITY
// Owns meaning: "ensure there is an anon identity for this client key".
// ============================================================================

import {
  createWandersAnonIdentity,
  getWandersAnonIdentityByClientKey,
  touchWandersAnonIdentity,
} from '@/features/wanders/dal/wandersAnon.dal'
import { getOrCreateWandersClientKey } from '@/features/wanders/lib/wandersClientKey'
import { toWandersAnonIdentity } from '@/features/wanders/models/wandersAnon.model'

/**
 * Ensure an anon identity exists for this device/client.
 * @param {{ clientKey?: string, touch?: boolean, userAgentHash?: string|null, ipHash?: string|null, deviceHash?: string|null }} input
 */
export async function ensureWandersAnonIdentity(input = {}) {
  const clientKey = input.clientKey || getOrCreateWandersClientKey()

  const existing = await getWandersAnonIdentityByClientKey(clientKey)
  if (existing) {
    if (input.touch) {
      const touched = await touchWandersAnonIdentity({
        anonId: existing.id,
        userAgentHash: input.userAgentHash,
        ipHash: input.ipHash,
        deviceHash: input.deviceHash,
      })
      return toWandersAnonIdentity(touched)
    }
    return toWandersAnonIdentity(existing)
  }

  try {
    const created = await createWandersAnonIdentity({
      clientKey,
      userAgentHash: input.userAgentHash ?? null,
      ipHash: input.ipHash ?? null,
      deviceHash: input.deviceHash ?? null,
    })
    return toWandersAnonIdentity(created)
  } catch (e) {
    // Race: another concurrent ensure inserted first (requires UNIQUE client_key).
    if (e?.code === '23505') {
      const row = await getWandersAnonIdentityByClientKey(clientKey)
      if (row) {
        if (input.touch) {
          const touched = await touchWandersAnonIdentity({
            anonId: row.id,
            userAgentHash: input.userAgentHash,
            ipHash: input.ipHash,
            deviceHash: input.deviceHash,
          })
          return toWandersAnonIdentity(touched)
        }
        return toWandersAnonIdentity(row)
      }
    }
    throw e
  }
}
