import { supabase } from '@/services/supabase/supabaseClient'

export async function dalHydrateAuthSession() {
  return supabase.auth.getSession()
}
