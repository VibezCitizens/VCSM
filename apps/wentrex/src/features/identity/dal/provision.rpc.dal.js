// src/features/identity/dal/provision.rpc.dal.js
// ============================================================
// Wentrex — Provisioning RPC DAL
// Calls: platform.provision_wentrex_identity(p_actor_id, p_organization_id)
//
// This is the ONLY write path for provisioning platform identity rows.
// The RPC is SECURITY DEFINER and uses auth.uid() internally — callers
// cannot provision rows for other users.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Call the platform.provision_wentrex_identity security-definer RPC.
 *
 * @param {Object} params
 * @param {string}      params.actorId
 * @param {string|null} [params.organizationId]
 */
export async function dalProvisionWentrexIdentity({ actorId, organizationId = null }) {
  const { data, error } = await supabase
    .schema('platform')
    .rpc('provision_wentrex_identity', {
      p_actor_id:        actorId,
      p_organization_id: organizationId ?? null,
    })

  if (error) throw error

  return data
}
