import { supabase } from '@/services/supabase/supabaseClient'

export async function readActorIdByUsername(username) {
  const { data, error } = await supabase
    .schema('identity')
    .from('actor_directory')
    .select('actor_id')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return data
}
