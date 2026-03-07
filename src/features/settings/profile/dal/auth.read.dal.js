import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetCurrentAuthUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}
