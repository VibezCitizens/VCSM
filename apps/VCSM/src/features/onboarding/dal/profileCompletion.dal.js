import { supabase } from '@/services/supabase/supabaseClient'

export async function readActorRowDAL(actorId) {
  if (!actorId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id,kind,profile_id,vport_id,is_void')
    .eq('id', actorId)
    .eq('is_void', false)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function readProfileCompletionFieldsDAL(profileId) {
  if (!profileId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,username,photo_url,bio')
    .eq('id', profileId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function readVportCompletionFieldsDAL(vportId) {
  if (!vportId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('vports')
    .select('id,name,avatar_url,bio')
    .eq('id', vportId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}
