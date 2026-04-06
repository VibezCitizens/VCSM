import { supabase } from '@/services/supabase/supabaseClient'

export async function readActorIdByUsername(username) {
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_presentation')
    .select('actor_id')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return data
}
