// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersAnon.model.js
// ============================================================================
// WANDERS MODEL — ANON IDENTITY
// Normalizes DAL/DB rows into a stable frontend shape.
// ============================================================================

/**
 * @typedef {Object} WandersAnonIdentity
 * @property {string|null} id
 * @property {string|null} createdAt
 * @property {string|null} lastSeenAt
 * @property {string|null} userAgentHash
 * @property {string|null} ipHash
 * @property {string|null} deviceHash
 * @property {string|null} clientKey
 */

/**
 * Convert a DAL/DB record (snake_case or camelCase) into a WandersAnonIdentity.
 * @param {any} row
 * @returns {WandersAnonIdentity|null}
 */
export function toWandersAnonIdentity(row) {
  if (!row) return null

  return {
    id: row.id ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    lastSeenAt: row.last_seen_at ?? row.lastSeenAt ?? null,
    userAgentHash: row.user_agent_hash ?? row.userAgentHash ?? null,
    ipHash: row.ip_hash ?? row.ipHash ?? null,
    deviceHash: row.device_hash ?? row.deviceHash ?? null,
    clientKey: row.client_key ?? row.clientKey ?? null,
  }
}
