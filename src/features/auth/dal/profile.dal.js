import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetProfileDiscoverable(profileId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, discoverable')
    .eq('id', profileId)
    .maybeSingle()

  if (error) throw error
  return data // raw DB row or null
}
