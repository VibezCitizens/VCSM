// src/services/roleService.js
// ============================================================
// Identity Engine — Role Service
// Resolves role keys for an app account.
// ============================================================

import { dalGetRoleKeysForAccount } from '../dal/roles.read.dal.js'

/**
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<string[]>}
 */
export async function resolveRoleKeys({ userAppAccountId }) {
  return dalGetRoleKeysForAccount({ userAppAccountId })
}
