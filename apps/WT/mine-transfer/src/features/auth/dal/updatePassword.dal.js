import { supabase } from '@/services/supabase/supabaseClient'

export async function dalUpdatePassword({ password }) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
