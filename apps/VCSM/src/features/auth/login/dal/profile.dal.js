import { supabase } from '@/services/supabase/supabaseClient'

// profiles.id === auth.users.id — this DAL operates on the auth user ID directly.
// It is intentionally a login-phase operation called before actor resolution completes.

export async function dalGetProfileDiscoverable(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, discoverable')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data // raw DB row or null
}

export async function dalUpdateProfileDiscoverable({
  userId,
  discoverable,
  updatedAt,
}) {
  const { error } = await supabase
    .from('profiles')
    .update({
      discoverable,
      updated_at: updatedAt,
    })
    .eq('id', userId)

  if (error) throw error
}
