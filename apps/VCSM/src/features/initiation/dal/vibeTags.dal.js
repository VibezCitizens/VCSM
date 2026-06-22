import { supabase } from '@/services/supabase/supabaseClient'

export async function readVibeTagsDAL() {
  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_tags')
    .select('key,label,description,icon,category,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.key,
    name: row.label,
    slug: row.key,
    color: null,
    sort_order: row.sort_order,
    is_active: row.is_active,
    description: row.description,
    icon: row.icon,
    category: row.category,
  }))
}

export async function readSelectedVibeTagsDAL(actorId) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_actor_tags')
    .select('actor_id,vibe_tag_key,created_at,created_by_actor_id,is_void')
    .eq('actor_id', actorId)
    .eq('is_void', false)

  if (error) throw error

  return (data ?? []).map((row) => ({
    actor_id: row.actor_id,
    tag_id: row.vibe_tag_key,
    created_at: row.created_at,
    created_by_actor_id: row.created_by_actor_id,
    is_void: row.is_void,
  }))
}

export async function replaceSelectedVibeTagsDAL({ actorId, tagIds = [] }) {
  if (!actorId) throw new Error('actorId is required')

  const uniqueTagIds = Array.from(
    new Set((Array.isArray(tagIds) ? tagIds : []).map((id) => String(id).trim()).filter(Boolean))
  )

  const { error: markVoidError } = await supabase
    .schema('vc')
    .from('vibe_actor_tags')
    .update({ is_void: true })
    .eq('actor_id', actorId)

  if (markVoidError) throw markVoidError

  if (!uniqueTagIds.length) return

  const rows = uniqueTagIds.map((tagId) => ({
    actor_id: actorId,
    vibe_tag_key: tagId,
    created_by_actor_id: actorId,
    is_void: false,
  }))

  const { error: upsertError } = await supabase
    .schema('vc')
    .from('vibe_actor_tags')
    .upsert(rows, { onConflict: 'actor_id,vibe_tag_key' })

  if (upsertError) throw upsertError
}
