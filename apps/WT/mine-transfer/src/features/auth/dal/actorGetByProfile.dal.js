import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetActorByProfile(profileId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id, is_void')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data // actor row or null
}
