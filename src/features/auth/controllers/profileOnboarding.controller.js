import { supabase } from '@/services/supabase/supabaseClient'

export async function ensureProfileShell(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const { error: upsertErr } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (upsertErr) throw upsertErr
    return { needsOnboarding: true }
  }

  const incomplete =
    !data.display_name?.trim() ||
    !data.username?.trim()

  return { needsOnboarding: incomplete }
}
