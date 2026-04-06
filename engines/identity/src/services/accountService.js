// src/services/accountService.js
// ============================================================
// Identity Engine — Account Service
// Resolves the user app account via the context view.
// ============================================================

import { dalGetUserAppContextByKey } from '../dal/account.read.dal.js'
import { AccountModel } from '../model/Account.model.js'

/**
 * Resolve the user app account for a given app key.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.appKey
 * @returns {Promise<import('../types/index.js').DomainAccount|null>}
 */
export async function resolveUserAppAccount({ userId, appKey, trace = null }) {
  const row = await dalGetUserAppContextByKey({ userId, appKey, trace })
  return row ? AccountModel(row) : null
}
