import { supabase } from '@/services/supabase/supabaseClient'

export async function readCurrentAuthUserDAL() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user ?? null
}

export async function dalHydrateAuthSession() {
  return supabase.auth.getSession()
}

export async function dalGetAuthSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data?.session ?? null
}

export function dalSubscribeAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}
