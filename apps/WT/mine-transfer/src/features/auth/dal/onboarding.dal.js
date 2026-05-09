import { supabase } from '@/services/supabase/supabaseClient'

export async function readCurrentSessionUserDAL() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data?.session?.user ?? null
}

export async function readCurrentAuthUserDAL() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user ?? null
}

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

export async function readProfileShellDAL(profileId) {
  if (!profileId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,username')
    .eq('id', profileId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function upsertProfileShellDAL({
  id,
  email,
  createdAt,
  updatedAt,
}) {
  const { error } = await supabase.from('profiles').upsert({
    id,
    email,
    created_at: createdAt,
    updated_at: updatedAt,
  })

  if (error) throw error
}

export async function generateUsernameDAL({ displayName, usernameBase }) {
  const { data, error } = await supabase.rpc('generate_username', {
    _display_name: displayName,
    _username: usernameBase,
  })

  if (error) throw error
  return data
}

export async function upsertCompletedOnboardingProfileDAL({
  profileId,
  displayName,
  username,
  birthdate,
  age,
  isAdult,
  sex,
  updatedAt,
}) {
  const { error } = await supabase.from('profiles').upsert({
    id: profileId,
    display_name: displayName,
    username,
    birthdate,
    age,
    is_adult: isAdult,
    sex,
    publish: true,
    discoverable: true,
    updated_at: updatedAt,
  })

  if (error) throw error
}
