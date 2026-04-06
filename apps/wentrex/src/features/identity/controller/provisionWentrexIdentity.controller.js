// src/features/identity/controller/provisionWentrexIdentity.controller.js
// ============================================================
// Wentrex — Provision Wentrex Identity
// ------------------------------------------------------------
// Ensures all required platform identity records exist for a
// Wentrex user, then resolves and returns AuthenticatedContext.
//
// This controller lives in Wentrex (not in the engine) because
// it orchestrates Wentrex-specific provisioning logic that
// queries learning.* schema tables.
// ============================================================

import { resolveSessionUser, resolveAuthenticatedContext } from '@identity'
import { dalProvisionWentrexIdentity } from '../dal/provision.rpc.dal.js'
import { resolveWentrexActorForProvisioning } from '../resolvers/wentrexIdentity.resolver.js'
import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Provision Wentrex identity for the current session user, then resolve context.
 *
 * Idempotent: safe to call on every login.
 *
 * @returns {Promise<import('@identity').AuthenticatedContext>}
 * @throws {{ code: string, message: string }}
 */
export async function provisionWentrexIdentity() {
  // 1. Require authenticated session
  const userId = await resolveSessionUser()
  if (!userId) {
    throw { code: 'NO_SESSION', message: 'User is not authenticated' }
  }

  // 2. Resolve learning actor (Wentrex-specific, queries learning.*)
  const { actor } = await resolveWentrexActorForProvisioning(supabase, userId)

  if (!actor) {
    throw {
      code:    'NO_LEARNING_ACTOR',
      message: 'No active learning actor found. Contact your administrator.',
    }
  }

  // 3. Provision all platform rows via security-definer RPC.
  await dalProvisionWentrexIdentity({
    actorId:        actor.id,
    organizationId: actor.organization_id ?? null,
  })

  // 4. Resolve and return the full authenticated context.
  return resolveAuthenticatedContext({ appKey: 'wentrex' })
}
