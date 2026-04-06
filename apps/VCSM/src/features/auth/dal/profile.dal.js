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

export async function dalUpdateProfileDiscoverable({
  profileId,
  discoverable,
  updatedAt,
}) {
  const { error } = await supabase
    .from('profiles')
    .update({
      discoverable,
      updated_at: updatedAt,
    })
    .eq('id', profileId)

  if (error) throw error
}
