import { supabase } from '@/services/supabase/supabaseClient'

/**
 * dalCreateUserActor
 * Creates a user actor tied to a profile via RPC (RLS-safe).
 * Returns raw actor row.
 */
export async function dalCreateUserActor(profileId) {
  if (!profileId) {
    throw new Error('profileId is required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .rpc('create_actor_for_user', {
      p_kind: 'user',
      p_profile_id: profileId,
      p_vport_id: null,
      p_is_void: false,
      p_is_primary: true,
    })

  if (error) throw error

  return {
    id: data.id,
    kind: data.kind,
    profile_id: data.profile_id,
    is_void: data.is_void,
  }
}
