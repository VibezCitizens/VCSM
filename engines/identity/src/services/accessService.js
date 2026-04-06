// src/services/accessService.js
// ============================================================
// Identity Engine — Access Service
// Resolves whether a user has granted access to an app.
// ============================================================

import { dalGetUserAppAccess } from '../dal/access.read.dal.js'
import { AccessModel } from '../model/Access.model.js'

/**
 * Resolve app access for a user.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.appId
 * @returns {Promise<import('../types/index.js').DomainAccess|null>}
 */
export async function resolveUserAppAccess({ userId, appId, trace = null }) {
  const row = await dalGetUserAppAccess({ userId, appId, trace })
  return row ? AccessModel(row) : null
}

/**
 * Returns true only if access status is 'granted'.
 *
 * @param {import('../types/index.js').DomainAccess|null} access
 * @returns {boolean}
 */
export function isAccessGranted(access) {
  return access?.status === 'granted'
}
