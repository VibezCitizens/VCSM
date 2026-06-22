import { supabase } from '@/services/supabase/supabaseClient'

export async function readProfileForOnboardingDAL(profileId) {
  if (!profileId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,birthdate')
    .eq('id', profileId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function generateUsernameDAL({ displayName, usernameBase }) {
  const { data, error } = await supabase.rpc('generate_username', {
    _display_name: displayName,
    _username: usernameBase,
  })

  if (error) throw error
  return data
}
