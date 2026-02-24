// src/features/actors/controllers/searchActors.controller.js

import { supabase } from '@/services/supabase/supabaseClient'
import { toContainsPattern } from '@/services/supabase/postgrestSafe'

export async function searchActors({ query, limit = 12 }) {
  const pattern = toContainsPattern(query)
  if (!pattern) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_presentation')
    .select(
      `
      actor_id,
      kind,
      display_name,
      username,
      photo_url,
      vport_name,
      vport_slug,
      vport_avatar_url
      `
    )
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(limit)

  if (error) throw error
  return data || []
}
