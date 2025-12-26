// chat/start/search/dal/searchActors.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

/**
 * DAL: searchActors
 * --------------------------------
 * Actor-centric search.
 * Returns RAW actor rows from vc.actor_presentation.
 *
 * NO inference
 * NO identity conversion
 */
export async function searchActorsDAL(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const exact = q.startsWith('@') ? q.slice(1) : q

  // Exact match first
  if (exact) {
    const { data, error } = await supabase
      .schema('vc')
      .from('actor_presentation')
      .select(
        'actor_id,kind,display_name,username,photo_url,vport_name,vport_slug'
      )
      .ilike('username', exact)
      .limit(1)

    if (error) throw error
    if (data?.length) return data
  }

  const pattern = `%${q}%`

  // Fuzzy search (⚠️ NO whitespace)
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_presentation')
    .select(
      'actor_id,kind,display_name,username,photo_url,vport_name,vport_slug'
    )
    .or(
      `username.ilike.${pattern},display_name.ilike.${pattern},vport_name.ilike.${pattern},vport_slug.ilike.${pattern}`
    )
    .order('display_name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
