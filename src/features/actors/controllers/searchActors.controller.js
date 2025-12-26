// src/features/actors/controllers/searchActors.controller.js

import { supabase } from '@/services/supabase/supabaseClient'

export async function searchActors({ query, limit = 12 }) {
  const q = (query || '').trim()
  if (!q) return []

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
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(limit)

  if (error) throw error
  return data || []
}
