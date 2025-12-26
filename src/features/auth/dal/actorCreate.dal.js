import { supabase } from '@/services/supabase/supabaseClient'

/**
 * dalCreateUserActor
 * Inserts a user actor tied to a profile.
 * Returns raw actor row.
 */
export async function dalCreateUserActor(profileId) {
  const { data, error } = await supabase
      .schema('vc')   
    .from('actors')
    .insert({
      kind: 'user',
      profile_id: profileId,
      is_void: false,
    })
    .select('id, kind, profile_id, is_void')
    .single()

  if (error) throw error
  return data
}
