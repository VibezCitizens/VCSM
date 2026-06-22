import { supabase } from '@/services/supabase/supabaseClient'

export async function dalExchangeCodeForSession(code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw error
  return data?.session ?? null
}
