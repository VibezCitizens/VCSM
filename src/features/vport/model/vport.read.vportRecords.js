import supabase from '@/services/supabase/supabaseClient'
import vc from '@/services/supabase/vcClient'

/* ---------------- AUTH ---------------- */

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error

  const user = data?.user || null
  if (!user) throw new Error('Not authenticated')

  return user
}

/* ---------------- READ MY VPORTS ---------------- */

export async function listMyVports() {
  const user = await requireUser()

  const { data, error } = await vc
    .from('vports')
    .select(`
      id,
      name,
      slug,
      avatar_url,
      banner_url,
      bio,
      is_active,
      created_at,
      actor:actors (
        id
      )
    `)
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listMyVports] failed', error)
    throw error
  }

  // normalize actor_id for the UI
  const mapped = (data || []).map(v => ({
    ...v,
    actor_id: v.actor?.id || null,
  }))

  return mapped
}
