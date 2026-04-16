// src/features/settings/profile/dal/actorIdBySubject.read.dal.js
// ============================================================
// Reads the actor ID for a given subject (profile or vport).
// Used after profile save to refresh the actor directory.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Resolve actor ID from a profile_id (user mode).
 * @param {string} profileId
 * @returns {Promise<string|null>}
 */
export async function dalReadActorIdByProfileId(profileId) {
  const { data } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', profileId)
    .eq('kind', 'user')
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Resolve actor ID from a vport_id (vport mode).
 * @param {string} vportId
 * @returns {Promise<string|null>}
 */
export async function dalReadActorIdByVportId(vportId) {
  const { data } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('vport_id', vportId)
    .eq('kind', 'vport')
    .maybeSingle()

  return data?.id ?? null
}
